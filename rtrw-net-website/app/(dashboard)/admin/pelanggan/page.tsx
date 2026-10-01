// app/(dashboard)/admin/pelanggan/page.tsx
import prisma from "@/lib/prisma";
import { PelangganClient } from "../_components/PelangganClient";
import { createPelanggan, updatePelanggan, updateUserStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function PelangganPage() {
  // Ambil semua user dengan role PELANGGAN
  // Sekaligus 'include' data tagihan yang belum lunas (UNPAID)
  const pelanggan = await prisma.user.findMany({
    where: {
      role: "PELANGGAN",
    },
    include: {
      invoices: {
        where: {
          status: "UNPAID",
        },
      },
      _count: {
        select: {
          referralsMade: {
            where: {
              status: "APPROVED",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Pelanggan</h1>
      <PelangganClient
        pelanggan={pelanggan}
        createAction={createPelanggan}
        updateStatusAction={updateUserStatus}
        updateAction={updatePelanggan}
      />
    </div>
  );
}
