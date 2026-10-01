// app/(dashboard)/pelanggan/page.tsx
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WelcomeHeader } from "./_components/WelcomeHeader";
import { TagihanPelanggan } from "./_components/TagihanPelanggan";
import { KeluhanPelanggan } from "./_components/KeluhanPelanggan";
import { PromotionDashboard } from "./_components/PromotionDashboard";
import { logout, submitKeluhan } from "./actions";

// Fungsi untuk mengambil data spesifik untuk user yang login
async function getDataPelanggan(userId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { userId: userId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const complaints = await prisma.complaint.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
  });

  return { invoices, complaints };
}

export default async function PelangganDashboardPage() {
  const session = await auth();

  // Middleware seharusnya sudah menangani ini, tapi ini adalah lapisan keamanan tambahan
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { invoices, complaints } = await getDataPelanggan(session.user.id);
  const user = session.user;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Pass server action 'logout' dan data user ke komponen header */}
        <WelcomeHeader user={user} logoutAction={logout} />

        <PromotionDashboard />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom Kiri: Daftar Tagihan */}
          <div className="lg:col-span-2">
            <TagihanPelanggan invoices={invoices} />
          </div>

          {/* Kolom Kanan: Form dan Daftar Keluhan */}
          <div>
            <KeluhanPelanggan
              complaints={complaints}
              submitAction={submitKeluhan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
