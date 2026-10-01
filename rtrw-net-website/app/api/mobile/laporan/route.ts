import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth"; // Helper proteksi kita

// GET: /api/mobile/laporan?startDate=...&endDate=...
export async function GET(request: NextRequest) {
  // 1. Proteksi route
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const { searchParams } = request.nextUrl;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Parameter startDate dan endDate dibutuhkan" },
        { status: 400 }
      );
    }

    // 2. Konversi timestamp string ke Date object
    const startDate = new Date(parseInt(startDateStr));
    const endDate = new Date(parseInt(endDateStr));
    // Atur endDate ke akhir hari (23:59:59) agar mencakup semua data di hari itu
    endDate.setHours(23, 59, 59, 999);

    // 3. Logika inti dari fetchPaymentReport (actions.ts)
    const payments = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: {
          gte: startDate, // Greater than or equal to startDate
          lte: endDate, // Less than or equal to endDate
        },
      },
      include: {
        user: {
          select: { name: true, idNumber: true }, // Hanya ambil data yg perlu
        },
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    // 4. Hitung ringkasan
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const paymentCount = payments.length;

    // 5. Kembalikan data
    return NextResponse.json({
      payments,
      summary: {
        totalRevenue,
        paymentCount,
      },
    });
  } catch (err: any) {
    console.error("Gagal fetch laporan:", err);
    return NextResponse.json(
      { error: `Gagal mengambil data laporan: ${err.message}` },
      { status: 500 }
    );
  }
}
