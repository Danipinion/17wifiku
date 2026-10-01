import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth"; // Helper proteksi kita
import { subMonths, format } from "date-fns"; // Pastikan install date-fns
import { id } from "date-fns/locale";

/**
 * Mengambil semua statistik untuk halaman dashboard admin.
 * Diadaptasi dari `getDashboardStats` di /app/(dashboard)/admin/page.tsx
 */
export async function GET(request: NextRequest) {
  // 1. Proteksi route
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);

    // 2. Ambil statistik utama
    const pemasukanBulanIni = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", month: currentMonth, year: currentYear },
    });
    const potensiPemasukan = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: {
        status: "UNPAID",
        month: currentMonth,
        year: currentYear,
      },
    });
    const pelangganBaru = await prisma.user.count({
      where: { role: "PELANGGAN", createdAt: { gte: startOfMonth } },
    });
    const keluhanTerbuka = await prisma.complaint.count({
      where: { status: "OPEN" },
    });

    const chartPromises = [];
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i);
      const m = date.getMonth() + 1;
      const y = date.getFullYear();

      const promise = prisma
        .$transaction([
          // Hitung Total Invoice bulan tsb (Total Client aktif saat itu)
          prisma.invoice.count({ where: { month: m, year: y } }),
          // Hitung yang sudah PAID
          prisma.invoice.count({
            where: { month: m, year: y, status: "PAID" },
          }),
        ])
        .then(([total, paid]) => ({
          label: format(date, "MMM", { locale: id }), // Jan, Feb
          fullDate: format(date, "yyyy-MM"),
          total: total,
          paid: paid,
        }));

      chartPromises.push(promise);
    }
    const chartData = await Promise.all(chartPromises);

    // 4. Ambil data untuk daftar cepat
    const keluhanTerbaru = await prisma.complaint.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    });

    const tagihanTerbaru = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    });

    // 5. Kembalikan semua data dalam satu objek
    return NextResponse.json({
      statCards: {
        pemasukanBulanIni: pemasukanBulanIni._sum.amount || 0,
        potensiPemasukan: potensiPemasukan._sum.amount || 0,
        pelangganBaru: pelangganBaru,
        keluhanTerbuka: keluhanTerbuka,
      },
      chartData: chartData,
      keluhanTerbaru: keluhanTerbaru.map((k) => ({
        id: k.id,
        subject: k.subject,
        userName: k.user.name,
      })),
      tagihanTerbaru: tagihanTerbaru.map((t) => ({
        id: t.id,
        userName: t.user.name,
        amount: t.amount,
        month: t.month,
        year: t.year,
      })),
    });
  } catch (err: any) {
    console.error("Gagal fetch dashboard stats:", err);
    return NextResponse.json(
      { error: `Gagal mengambil data: ${err.message}` },
      { status: 500 },
    );
  }
}
