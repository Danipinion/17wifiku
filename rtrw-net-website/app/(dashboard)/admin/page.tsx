// app/(dashboard)/admin/page.tsx
import prisma from "@/lib/prisma";
import {
  DollarSign,
  FileWarning,
  MessageCircleWarning,
  UserPlus,
} from "lucide-react";
import { ChartPendapatan } from "./_components/ChartPendapatan";
import { KeluhanTerbaru } from "./_components/KeluhanTerbaru";
import { TagihanTerbaru } from "./_components/TagihanTerbaru";

export const dynamic = "force-dynamic";

function formatCurrency(amount: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

async function getDashboardStats() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);

  // 1. Ambil statistik utama
  const pemasukanBulanIni = await prisma.invoice.aggregate({
    _sum: { amount: true },
    where: { status: "PAID", month: currentMonth, year: currentYear },
  });

  const potensiPemasukan = await prisma.invoice.aggregate({
    _sum: { amount: true },
    where: { status: "UNPAID" }, // Semua yang belum lunas
  });

  const pelangganBaru = await prisma.user.count({
    where: { role: "PELANGGAN", createdAt: { gte: startOfMonth } },
  });

  const keluhanTerbuka = await prisma.complaint.count({
    where: { status: "OPEN" },
  });

  // 2. Ambil data untuk chart pendapatan 6 bulan terakhir
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const monthName = d.toLocaleString("id-ID", { month: "short" });

    const monthlyRevenue = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", month, year },
    });

    chartData.push({
      name: `${monthName} '${String(year).slice(2)}`,
      Total: monthlyRevenue._sum.amount || 0,
    });
  }

  // 3. Ambil data untuk daftar cepat
  const keluhanTerbaru = await prisma.complaint.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { name: true } } },
  });

  const tagihanTerbaru = await prisma.invoice.findMany({
    where: { status: "UNPAID" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { user: { select: { name: true } } },
  });

  return {
    pemasukanBulanIni: pemasukanBulanIni._sum.amount,
    potensiPemasukan: potensiPemasukan._sum.amount,
    pelangganBaru,
    keluhanTerbuka,
    chartData,
    keluhanTerbaru,
    tagihanTerbaru,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard Statistik</h1>

      {/* Kartu Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={DollarSign}
          title="Pemasukan Bulan Ini"
          value={formatCurrency(stats.pemasukanBulanIni)}
          color="text-green-400 bg-green-500/20"
        />
        <StatCard
          icon={FileWarning}
          title="Potensi Pemasukan"
          value={formatCurrency(stats.potensiPemasukan)}
          color="text-yellow-400 bg-yellow-500/20"
        />
        <StatCard
          icon={UserPlus}
          title="Pelanggan Baru Bulan Ini"
          value={`+${stats.pelangganBaru}`}
          color="text-blue-400 bg-blue-500/20"
        />
        <StatCard
          icon={MessageCircleWarning}
          title="Keluhan Terbuka"
          value={stats.keluhanTerbuka}
          color="text-red-400 bg-red-500/20"
        />
      </div>

      {/* Konten Utama: Chart dan Daftar Cepat */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-4">
            Grafik Pendapatan (6 Bulan Terakhir)
          </h2>
          <ChartPendapatan data={stats.chartData} />
        </div>
        <div className="space-y-8">
          <KeluhanTerbaru keluhan={stats.keluhanTerbaru} />
          <TagihanTerbaru tagihan={stats.tagihanTerbaru} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="p-6 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-4">
      <div className={`p-3 rounded-full ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}
