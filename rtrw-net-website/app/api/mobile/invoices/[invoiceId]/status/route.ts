import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { InvoiceStatus } from "@prisma/client";
import {
  generateInvoicePdf,
  getMonthName,
  sendWhatsAppDocument,
} from "@/lib/billingHelpers";
import {
  notificationEmitter,
  NOTIFICATION_EVENT,
} from "@/lib/notificationStream"; // [BARU]

function getCurrentTimeWIB() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// PATCH: /api/mobile/invoices/[invoiceId]/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } },
) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const { status } = (await request.json()) as { status: InvoiceStatus };
    const { invoiceId } = params;

    if (status === "UNPAID") {
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "UNPAID", paidAt: null, pdfUrl: null },
      });
      return NextResponse.json(updatedInvoice);
    }

    if (status === "PAID") {
      const invoice = await prisma.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { user: true },
      });

      // Jangan proses jika sudah lunas
      if (invoice.status === "PAID" && invoice.pdfUrl) {
        return NextResponse.json(invoice);
      }

      const { pdfUrl, pdfBuffer, fileName } = await generateInvoicePdf(invoice);

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          pdfUrl: pdfUrl,
        },
        include: {
          user: {
            select: { name: true, phone: true, address: true, abonemen: true },
          },
        },
      });

      // Kirim notifikasi Document WA
      const message = `*TERIMA KASIH ATAS PEMBAYARAN ANDA*\n
Yth. Bapak / Ibu
*${updatedInvoice.user.name}*
${updatedInvoice.user.phone}
${updatedInvoice.user.address || ""}
 
*PEMBAYARAN*
*Tanggal Bayar : ${
        updatedInvoice.paidAt?.toLocaleString("id-ID", { dateStyle: "long" }) ??
        "Tanggal tidak tersedia"
      }*
*Jam Bayar : ${
        updatedInvoice.paidAt?.toLocaleString("id-ID", {
          timeStyle: "short",
        }) ?? "Jam tidak tersedia"
      }*

Tagihan Bulan:
- ${getMonthName(updatedInvoice.month)} ${updatedInvoice.year}
Harga Paket : Rp ${updatedInvoice.user.abonemen.toLocaleString("id-ID")}

Total Bayar : *Rp ${updatedInvoice.amount.toLocaleString("id-ID")}*
Ket : *LUNAS*

_Nota digital telah dilampirkan dalam pesan ini._`;

      sendWhatsAppDocument(
        updatedInvoice.user.phone,
        pdfBuffer,
        fileName,
        message,
      );

      const jamBayar = getCurrentTimeWIB();
      notificationEmitter.emit(NOTIFICATION_EVENT, {
        title: "Pembayaran Diterima",
        message: `${updatedInvoice.user.name}\nTagihan: ${getMonthName(
          updatedInvoice.month,
        )} ${
          updatedInvoice.year
        }\nJam: ${jamBayar}\nTotal: Rp ${updatedInvoice.amount.toLocaleString(
          "id-ID",
        )}`,
        type: "PAYMENT_SUCCESS",
        invoiceId: updatedInvoice.id,
      });

      // [BARU] Simpan notifikasi ke database untuk pelanggan
      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          title: "Pembayaran Berhasil",
          content: `Terima kasih! Pembayaran tagihan periode ${getMonthName(
            updatedInvoice.month,
          )} ${
            updatedInvoice.year
          } sebesar Rp ${updatedInvoice.amount.toLocaleString(
            "id-ID",
          )} telah kami terima. Semoga Anda menikmati layanan kami dengan senang hati.`,
          type: "BILLING",
          metadata: JSON.stringify({ invoiceId: updatedInvoice.id }),
        },
      });

      return NextResponse.json(updatedInvoice);
    }

    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  } catch (err: any) {
    console.error("Gagal update status tagihan:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
