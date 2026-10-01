// app/(dashboard)/pelanggan/_components/TagihanPelanggan.tsx
"use client";

import { Invoice } from "@prisma/client";
import { ExternalLink, Printer } from "lucide-react";
import Link from "next/link";

type TagihanPelangganProps = {
  invoices: Invoice[];
};

const monthNames = [
  "",
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

export function TagihanPelanggan({ invoices }: TagihanPelangganProps) {
  return (
    <div className="p-6 bg-slate-900 rounded-lg border border-slate-800">
      <h2 className="text-xl font-bold mb-4">Riwayat Tagihan Anda</h2>
      <div className="space-y-4">
        {invoices.length > 0 ? (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex justify-between items-center p-4 bg-slate-800/50 rounded-md"
            >
              <div>
                <p className="font-semibold">
                  Tagihan {monthNames[invoice.month]} {invoice.year}
                </p>
                <p className="text-sm text-gray-400">
                  Rp {invoice.amount.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    invoice.status === "PAID"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {invoice.status === "PAID" ? "Lunas" : "Belum Lunas"}
                </span>
                {invoice.status === "PAID" && invoice.pdfUrl ? (
                  <Link
                    href={invoice.pdfUrl}
                    target="_blank" // Buka di tab baru
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                    title="Cetak Nota"
                  >
                    <Printer size={14} />
                    <span>Cetak</span>
                  </Link>
                ) : (
                  <Link
                    href={`/nota/${invoice.id}`}
                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                    title="Lihat Detail Nota"
                  >
                    <ExternalLink size={18} />
                  </Link>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-8">
            Belum ada riwayat tagihan.
          </p>
        )}
      </div>
    </div>
  );
}
