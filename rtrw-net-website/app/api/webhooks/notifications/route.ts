import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateInvoicePdf,
  getMonthName,
  sendWhatsAppDocument,
  mergePdfBuffers,
} from "@/lib/billingHelpers";
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

/**
 * POST /api/webhooks/notifications
 * Alur pengolahan notifikasi dari aplikasi Android Notification Listener
 * Target: Mendeteksi pembayaran otomatis (DANA)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageName, amountDetected, text, title, appName } = body;

    // 1. Validasi API Key dari Header (Pastikan kamu set di .env Next.js kamu)
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.NOTIFICATION_WEB_HOOK_KEY) {
      console.warn("⚠️ Webhook Unauthorized: API Key mismatch");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Filter hanya dari aplikasi DANA
    // Berdasarkan info user, package dana bisnis/biasa adalah "id.dana"
    if (!packageName || !packageName.includes("id.dana")) {
      return NextResponse.json({
        success: true,
        message: `Ignored: App ${appName || 'Unknown'} (${packageName || 'No Package'}) is not tracked.`,
      });
    }

    // 3. Jika nominal terdeteksi oleh Android
    if (amountDetected) {
      const receivedAmount = parseFloat(amountDetected);

      // 3. Cari permintaan pembayaran yang cocok
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          totalAmount: receivedAmount,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (pendingPayment) {
        console.log(
          `✅ Match Found! Payment ID ${pendingPayment.id} matched: ${receivedAmount}`,
        );

        // Identifikasi Invoice(s)
        let invoiceIds: string[] = [];
        const payment = pendingPayment as any;
        if (payment.bulkInvoiceIds) {
          invoiceIds = payment.bulkInvoiceIds.split(",");
        } else if (payment.invoiceId) {
          invoiceIds = [payment.invoiceId];
        }

        if (invoiceIds.length === 0) {
          return NextResponse.json(
            { error: "No Invoices linked to this payment." },
            { status: 400 },
          );
        }

        // Ambil data Invoice & User
        const invoices = await prisma.invoice.findMany({
          where: { id: { in: invoiceIds } },
          include: { user: true },
        });

        if (invoices.length === 0) {
          return NextResponse.json(
            { error: "Invoices not found." },
            { status: 404 },
          );
        }

        const user = invoices[0].user;

        // 4. Proses pelunasan (Generate PDF, Kirim WA, Push Notif)
        let finalPdfBuffer: Buffer;
        let finalFileName: string = "";
        const invoiceUpdates: any[] = [];
        const pdfBuffers: Buffer[] = [];

        for (const inv of invoices) {
          const { pdfUrl, pdfBuffer, fileName } = await generateInvoicePdf(inv as any);
          pdfBuffers.push(pdfBuffer);
          
          // Prepare update for this specific invoice
          invoiceUpdates.push(
            prisma.invoice.update({
              where: { id: inv.id },
              data: {
                status: "PAID",
                paidAt: new Date(),
                pdfUrl: pdfUrl,
              },
            })
          );

          if (invoices.length === 1) {
            finalFileName = fileName;
          }
        }

        if (invoices.length > 1) {
          finalPdfBuffer = await mergePdfBuffers(pdfBuffers);
          finalFileName = `INV-BULK-${user.name.replace(/\s+/g, "_")}-${new Date().getTime()}.pdf`;
        } else {
          finalPdfBuffer = pdfBuffers[0];
        }

        // Update database secara atomik
        await prisma.$transaction([
          ...invoiceUpdates,
          prisma.payment.update({
            where: { id: pendingPayment.id },
            data: { status: "SUCCESS" },
          }),
          prisma.notification.create({
            data: {
              userId: pendingPayment.userId,
              title: "Pembayaran Berhasil",
              content: `Terima kasih! Pembayaran ${invoices.length} tagihan sebesar Rp ${receivedAmount.toLocaleString("id-ID")} telah kami terima via QRIS Otomatis.`,
              type: "BILLING",
            },
          }),
        ]);

        // 5. Kirim Notifikasi WhatsApp
        const periodeStr = invoices
          .map((inv) => `${getMonthName(inv.month)} ${inv.year}`)
          .join(", ");
        const waMessage = `*TERIMA KASIH ATAS PEMBAYARAN ANDA*\n
Yth. Bapak / Ibu
*${user.name}*
${user.phone}
  
*PEMBAYARAN QRIS OTOMATIS BERHASIL*
*Tanggal : ${new Date().toLocaleString("id-ID", { dateStyle: "long" })}*
*Jam : ${getCurrentTimeWIB()} WIB*

Tagihan periode:
- ${periodeStr}

Total Bayar : *Rp ${receivedAmount.toLocaleString("id-ID")}*
(Termasuk Kode Unik)
Ket : *LUNAS*

_Nota digital telah dilampirkan dalam pesan ini._`;

        await sendWhatsAppDocument(
          user.phone,
          finalPdfBuffer,
          finalFileName,
          waMessage,
        );

        // 6. Emit real-time dashboard notification
        notificationEmitter.emit(NOTIFICATION_EVENT, {
          title: "Pembayaran QRIS",
          message: `${user.name}\nTagihan: ${periodeStr}\nTotal: Rp ${receivedAmount.toLocaleString("id-ID")}`,
          type: "PAYMENT_SUCCESS",
        });

        return NextResponse.json({
          success: true,
          message: "Bulk payment processed.",
        });
      } else {
        console.log(
          `ℹ️ Payment with amount ${receivedAmount} received, but no matching PENDING payment request found.`,
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notification logged but no action taken.",
    });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
