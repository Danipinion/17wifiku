import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import {
  generateInvoicePdf,
  getMonthName,
  sendWhatsAppMessage,
  sendWhatsAppDocument,
  mergePdfBuffers,
} from "@/lib/billingHelpers"; // Pastikan helper ini sudah ada
import { Invoice, User } from "@prisma/client";
import {
  notificationEmitter,
  NOTIFICATION_EVENT,
} from "@/lib/notificationStream";

function getCurrentTimeWIB() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// POST: /api/mobile/invoices/bulk-status
export async function POST(request: NextRequest) {
  // 1. Proteksi route
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const { invoiceIds } = (await request.json()) as { invoiceIds: string[] };

    if (!invoiceIds || invoiceIds.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada tagihan yang dipilih." },
        { status: 400 },
      );
    }

    // 2. Ambil data invoice DAN user lengkap untuk PDF
    const invoicesToUpdate = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        status: "UNPAID",
      },
      include: {
        user: true, // Data user lengkap diperlukan oleh generateInvoicePdf
      },
    });

    if (invoicesToUpdate.length === 0) {
      return NextResponse.json({
        message: "Tidak ada tagihan yang diperbarui (mungkin sudah lunas).",
      });
    }

    // 3. Buat promise untuk setiap invoice (generate PDF + update DB)
    const updatePromises = invoicesToUpdate.map(async (invoice) => {
      try {
        const { pdfUrl, pdfBuffer, fileName } =
          await generateInvoicePdf(invoice);
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            pdfUrl: pdfUrl,
          },
          include: { user: true }, // Include user lagi untuk data WA
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

        return {
          status: "success",
          invoice: updatedInvoice,
          pdfBuffer,
          fileName,
        };
      } catch (error: any) {
        console.error(`Gagal proses invoice ${invoice.id}: ${error.message}`);
        return { status: "error", invoice: invoice, error: error.message };
      }
    });

    // 4. Jalankan semua promise secara paralel
    const results = await Promise.all(updatePromises);

    // 5. Pisahkan yang sukses dan gagal
    const successfulInvoicesWithMeta: {
      invoice: Invoice & { user: User };
      pdfBuffer: Buffer;
      fileName: string;
    }[] = [];
    const failedInvoiceMessages: string[] = [];

    for (const res of results) {
      const result = res as any;
      if (result.status === "success") {
        successfulInvoicesWithMeta.push({
          invoice: result.invoice,
          pdfBuffer: result.pdfBuffer,
          fileName: result.fileName,
        });
      } else {
        failedInvoiceMessages.push(
          `ID: ${result.invoice.id} (${result.invoice.user.name}) - ${result.error}`,
        );
      }
    }

    const successfulInvoices = successfulInvoicesWithMeta.map((s) => s.invoice);

    // 6. Kelompokkan yang sukses berdasarkan userId untuk notifikasi WA
    const invoicesByUser = new Map<string, (Invoice & { user: User })[]>();
    for (const invoice of successfulInvoices) {
      if (!invoicesByUser.has(invoice.userId)) {
        invoicesByUser.set(invoice.userId, []);
      }
      invoicesByUser.get(invoice.userId)!.push(invoice);
    }

    if (successfulInvoices.length > 0) {
      const totalAmount = successfulInvoices.reduce(
        (sum, inv) => sum + inv.amount,
        0,
      );
      const jamBayar = getCurrentTimeWIB();

      let notifTitle = "";
      let notifMessage = "";

      // SKENARIO 1: Jika cuma 1 tagihan (Single Payment via Bulk Endpoint)
      if (successfulInvoices.length === 1) {
        const inv = successfulInvoices[0];
        notifTitle = "Pembayaran Diterima";
        notifMessage = `${inv.user.name}\nTagihan: ${getMonthName(inv.month)} ${
          inv.year
        }\nJam: ${jamBayar}\nTotal: Rp ${inv.amount.toLocaleString("id-ID")}`;
      }
      // SKENARIO 2: Jika banyak tagihan (Bulk Payment) -> Breakdown list
      else {
        notifTitle = `Pembayaran Massal (${successfulInvoices.length})`;

        // Buat list breakdown: "1. Dani (Jan) \n 2. Budi (Feb)"
        const breakdownList = successfulInvoices
          .map((inv, index) => {
            return `${index + 1}. ${inv.user.name} (${getMonthName(
              inv.month,
            )})`;
          })
          .join("\n");

        notifMessage = `${breakdownList}\n\nTotal: Rp ${totalAmount.toLocaleString(
          "id-ID",
        )}\nJam: ${jamBayar}`;
      }

      // Emit ke Stream (NotificationService di Android akan menangkap ini)
      notificationEmitter.emit(NOTIFICATION_EVENT, {
        title: notifTitle,
        message: notifMessage,
        type: "PAYMENT_SUCCESS",
      });
    }

    // 7. Kirim notifikasi WA massal (1 pesan per user)
    // Kita jalankan ini di background (tanpa await) agar API bisa merespons
    // aplikasi mobile dengan cepat.
    (async () => {
      const waErrorMessages: string[] = [];
      const invoicesByUser = new Map<
        string,
        {
          invoice: Invoice & { user: User };
          pdfBuffer: Buffer;
          fileName: string;
        }[]
      >();
      for (const item of successfulInvoicesWithMeta) {
        if (!invoicesByUser.has(item.invoice.userId)) {
          invoicesByUser.set(item.invoice.userId, []);
        }
        invoicesByUser.get(item.invoice.userId)!.push(item);
      }

      for (const [userId, items] of invoicesByUser.entries()) {
        try {
          const user = items[0].invoice.user;
          let invoiceListText = "";
          let totalPaid = 0;

          // Urutkan invoice agar rapi di pesan WA
          items.sort((a, b) =>
            a.invoice.year !== b.invoice.year
              ? a.invoice.year - b.invoice.year
              : a.invoice.month - b.invoice.month,
          );

          for (let i = 0; i < items.length; i++) {
            const inv = items[i].invoice;
            const periode = `${getMonthName(inv.month)} ${inv.year}`;
            invoiceListText += `${i + 1}. ${periode}\n`;
            totalPaid += inv.amount;
          }

          const message = `*TERIMA KASIH ATAS PEMBAYARAN ANDA*\n
Yth. Bapak / Ibu
*${user.name}*
${user.phone}
${user.address || ""}

Kami telah menerima pembayaran Anda untuk tagihan internet dengan rincian sebagai berikut:

${invoiceListText}
*Total Pembayaran: Rp ${totalPaid.toLocaleString("id-ID")}*

_Nota digital telah dilampirkan dalam pesan ini._

Terima kasih telah melakukan pembayaran tepat waktu.`;

          // Gabungkan PDF jika lebih dari satu
          const pdfBuffers = items.map((i) => i.pdfBuffer);
          const mergedPdfBuffer = await mergePdfBuffers(pdfBuffers);

          const periodNames = items
            .map((i) => getMonthName(i.invoice.month).substring(0, 3))
            .join("-");
          const mergedFileName =
            items.length > 1
              ? `nota_${user.name.replace(/[^a-z0-9]/gi, "_")}_${periodNames}.pdf`
              : items[0].fileName;

          await sendWhatsAppDocument(
            user.phone,
            mergedPdfBuffer,
            mergedFileName,
            message,
          );
        } catch (error: any) {
          console.error(
            `Gagal kirim WA ke ${items[0].invoice.user.name}:`,
            error,
          );
          waErrorMessages.push(items[0].invoice.user.name);
        }
      }
      if (waErrorMessages.length > 0) {
        console.error(
          "Gagal mengirim WA massal ke:",
          waErrorMessages.join(", "),
        );
      }
    })(); // <-- Tanda () di akhir ini menjalankan fungsinya tanpa di-await

    // 8. Kembalikan respons ke aplikasi mobile
    let successMsg = `${successfulInvoices.length} tagihan berhasil lunas. Notifikasi WA sedang dikirim.`;
    let errorMsg = "";

    if (failedInvoiceMessages.length > 0) {
      errorMsg = `Gagal proses ${
        failedInvoiceMessages.length
      } tagihan: ${failedInvoiceMessages.join(", ")}.`;
    }

    return NextResponse.json(successfulInvoices);
  } catch (error: any) {
    console.error("Gagal update status massal:", error);
    return NextResponse.json(
      { error: `Terjadi kesalahan: ${error.message}` },
      { status: 500 },
    );
  }
}
