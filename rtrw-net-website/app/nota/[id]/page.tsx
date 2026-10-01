// app/nota/[id]/page.tsx
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

async function getInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: {
        select: {
          name: true,
          address: true,
          phone: true,
        },
      },
    },
  });
  return invoice;
}

export default async function NotaPage({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id);

  if (!invoice) {
    notFound();
  }

  const statusClass =
    invoice.status === "PAID"
      ? "bg-green-500 text-white"
      : "bg-red-500 text-white";

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8 text-gray-800">
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-blue-800">INVOICE</h1>
          <div
            className={`text-sm font-bold px-4 py-1 rounded-full ${statusClass}`}
          >
            {invoice.status}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-bold mb-1">Ditagihkan Kepada:</h3>
            <p>{invoice.user.name}</p>
            <p>{invoice.user.address}</p>
            <p>{invoice.user.phone}</p>
          </div>
          <div className="text-right">
            <p>
              <span className="font-bold">ID Tagihan:</span> #
              {invoice.id.substring(0, 8)}
            </p>
            <p>
              <span className="font-bold">Tanggal Terbit:</span>{" "}
              {new Date(invoice.createdAt).toLocaleDateString("id-ID")}
            </p>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3">Deskripsi</th>
                <th className="p-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">
                  Tagihan Internet Bulan {monthNames[invoice.month - 1]}{" "}
                  {invoice.year}
                </td>
                <td className="p-3 text-right">
                  Rp {invoice.amount.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-6">
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-lg font-bold bg-blue-100 p-3 rounded-md">
              <span>Total</span>
              <span>Rp {invoice.amount.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
        {invoice.status === "PAID" && invoice.paidAt && (
          <div className="text-center mt-6 text-green-600 font-semibold">
            Lunas pada tanggal{" "}
            {new Date(invoice.paidAt).toLocaleDateString("id-ID")}
          </div>
        )}
      </div>
    </div>
  );
}
