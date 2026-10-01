// app/(dashboard)/admin/pelanggan/[id]/page.tsx

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DetailPelangganClient } from "./_components/DetailPelangganClient";
import {
  updateUserStatus,
  updatePelanggan,
  updateInvoiceStatus,
  updateComplaintStatus,
} from "../../actions";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { getGenieACSDevice, getUnlinkedGenieACSDevices } from "@/lib/genieacs";
import { 
  linkGenieACSDevice, 
  unlinkGenieACSDevice,
  renameGenieACSDevice,
  rebootGenieACSDevice, 
  refreshGenieACSDevice, 
  changeWifiPassword 
} from "../../actions";

// Fungsi untuk mengambil semua data terkait satu pelanggan
async function getPelangganDetail(id: string) {
  try {
    const pelanggan = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        invoices: {
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
        complaints: {
          orderBy: { createdAt: "desc" },
        },
        genieacsDevices: true,
        referralsMade: {
          where: { status: "APPROVED" },
          include: {
            referee: {
              select: {
                id: true,
                name: true,
                idNumber: true,
                phone: true,
                status: true,
                invoices: {
                  where: {
                    OR: [
                      { status: "UNPAID" },
                      {
                        month: new Date().getMonth() + 1,
                        year: new Date().getFullYear(),
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });
    return pelanggan;
  } catch (_error) {
    notFound();
  }
}

export default async function DetailPelangganPage({
  params,
}: {
  params: { id: string };
}) {
  const pelanggan = await getPelangganDetail(params.id);
  
  const genieacsDevices = await Promise.all(
    pelanggan.genieacsDevices.map(async (dev) => {
      const data = await getGenieACSDevice(dev.deviceId);
      return {
        ...dev,
        genieacsData: data,
      };
    })
  );

  const unlinkedDevices = await getUnlinkedGenieACSDevices();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/pelanggan"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ChevronLeft size={16} />
          Kembali ke Daftar Pelanggan
        </Link>
      </div>

      <DetailPelangganClient
        pelanggan={pelanggan}
        updateStatusAction={updateUserStatus}
        updateAction={updatePelanggan}
        updateInvoiceStatusAction={updateInvoiceStatus}
        updateComplaintStatusAction={updateComplaintStatus}
        linkGenieACSDeviceAction={linkGenieACSDevice}
        unlinkGenieACSDeviceAction={unlinkGenieACSDevice}
        renameGenieACSDeviceAction={renameGenieACSDevice}
        rebootGenieACSDeviceAction={rebootGenieACSDevice}
        refreshGenieACSDeviceAction={refreshGenieACSDevice}
        changeWifiPasswordAction={changeWifiPassword}
        linkedDevices={genieacsDevices}
        unlinkedDevices={unlinkedDevices}
      />
    </div>
  );
}
