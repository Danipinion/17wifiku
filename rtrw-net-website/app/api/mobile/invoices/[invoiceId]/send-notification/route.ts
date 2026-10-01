import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { getMonthName, sendWhatsAppMessage } from "@/lib/billingHelpers";

export async function POST(
  request: NextRequest,
  { params }: { params: { invoiceId: string } },
) {
  // 1. Cek sesi admin
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const { invoiceId } = params;

    // 2. Ambil data invoice & user
    const invoice = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { user: true },
    });

    // 3. Validasi: Hanya bisa kirim jika status PAID dan ada PDF
    if (invoice.status !== "PAID" || !invoice.pdfUrl) {
      return NextResponse.json(
        { error: "Tagihan belum lunas atau PDF belum digenerate." },
        { status: 400 },
      );
    }

    // 4. Susun Pesan (Sama seperti logic di PATCH status)
    const message = `*TERIMA KASIH ATAS PEMBAYARAN ANDA*\n
Yth. Bapak / Ibu
*${invoice.user.name}*
${invoice.user.phone}
${invoice.user.address || ""}

*PEMBAYARAN*
*Tanggal Bayar : ${
      invoice.paidAt?.toLocaleString("id-ID", { dateStyle: "long" }) ?? "-"
    }*
*Jam Bayar : ${
      invoice.paidAt?.toLocaleString("id-ID", { timeStyle: "short" }) ?? "-"
    }*

Tagihan Bulan:
- ${getMonthName(invoice.month)} ${invoice.year}
Harga Paket : Rp ${invoice.user.abonemen.toLocaleString("id-ID")}

Total Bayar : *Rp ${invoice.amount.toLocaleString("id-ID")}*
Ket : *LUNAS*

*LINK NOTA*
${invoice.pdfUrl}`;

    // 5. Kirim via Fonnte
    await sendWhatsAppMessage(invoice.user.phone, message);

    return NextResponse.json({
      message: "Notifikasi WhatsApp berhasil dikirim via Server",
    });
  } catch (err: any) {
    console.error("Gagal kirim notifikasi:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
