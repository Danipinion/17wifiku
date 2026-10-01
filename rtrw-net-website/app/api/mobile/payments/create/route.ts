import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";
import { generateDynamicQRIS } from "@/lib/qris";

// Data QRIS Statis Toko Mulya (diperoleh dari scan user)
const STATIC_QRIS_TOKO_MULYA = "00020101021126570011ID.DANA.WWW011893600915390447784202099044778420303UMI51440014ID.CO.QRIS.WWW0215ID10254032002370303UMI5204549953033605802ID5910Toko Mulya6011Kab. Madiun6105631726304B6DE";

/**
 * POST /api/mobile/payments/create
 * Dipanggil oleh aplikasi SobatWiff saat user klik tombol bayar.
 */
export async function POST(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const { invoiceId, invoiceIds } = await request.json();

    if (!invoiceId && (!invoiceIds || invoiceIds.length === 0)) {
      return NextResponse.json({ error: "Invoice ID atau daftar Invoice wajib diisi" }, { status: 400 });
    }

    let targetInvoiceIds: string[] = [];
    let totalOriginalAmount = 0;

    if (invoiceIds && Array.isArray(invoiceIds)) {
      // BULK PAYMENT
      const invoices = await prisma.invoice.findMany({
        where: { id: { in: invoiceIds }, userId: session.id, status: "UNPAID" },
        orderBy: [{ year: "asc" }, { month: "asc" }]
      });

      if (invoices.length === 0) {
        return NextResponse.json({ error: "Tagihan tidak ditemukan atau sudah lunas." }, { status: 404 });
      }

      targetInvoiceIds = invoices.map(i => i.id);
      totalOriginalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);

      // Verifikasi urutan (harus menyertakan yang tertua)
      const oldestUnpaid = await prisma.invoice.findFirst({
        where: { userId: session.id, status: "UNPAID" },
        orderBy: [{ year: "asc" }, { month: "asc" }]
      });

      if (oldestUnpaid && !targetInvoiceIds.includes(oldestUnpaid.id)) {
        return NextResponse.json({ error: "Mohon sertakan tagihan tertua terlebih dahulu." }, { status: 400 });
      }

    } else {
      // SINGLE PAYMENT
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice || invoice.userId !== session.id) {
        return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
      }

      if (invoice.status === "PAID") {
        return NextResponse.json({ error: "Tagihan sudah lunas." }, { status: 400 });
      }

      // ⛔ CEK TUNGGAKAN BULAN SEBELUMNYA
      const olderUnpaid = await prisma.invoice.findFirst({
        where: {
          userId: session.id,
          status: "UNPAID",
          OR: [
            { year: { lt: invoice.year } },
            { year: invoice.year, month: { lt: invoice.month } }
          ]
        }
      });

      if (olderUnpaid) {
        return NextResponse.json({ 
          error: "Maaf, Anda harus melunasi tagihan tertua terlebih dahulu." 
        }, { status: 400 });
      }

      targetInvoiceIds = [invoice.id];
      totalOriginalAmount = invoice.amount;
    }

    // ⛔ CEK APAKAH USER PUNYA PEMBAYARAN AKTIF LAINNYA
    const activePayment = await prisma.payment.findFirst({
      where: {
        userId: session.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    const bulkIdsStr = targetInvoiceIds.join(",");

    if (activePayment) {
      // Jika yang aktif sama persis dengan yang diminta, kembalikan saja (Re-use)
      const isSameMatch = targetInvoiceIds.length > 1
        ? activePayment.bulkInvoiceIds === bulkIdsStr
        : activePayment.invoiceId === targetInvoiceIds[0];

      if (isSameMatch) {
         // Generate Dynamic QRIS berdasar totalAmount
        const qrisData = generateDynamicQRIS(STATIC_QRIS_TOKO_MULYA, activePayment.totalAmount);
        return NextResponse.json({ 
          success: true, 
          payment: activePayment,
          qrisData: qrisData
        });
      } else {
        // Berbeda, user harus selesaikan atau batalkan yang lama
        const qrisData = generateDynamicQRIS(STATIC_QRIS_TOKO_MULYA, activePayment.totalAmount);
        return NextResponse.json({ 
          error: "Anda memiliki pembayaran aktif yang belum selesai. Silakan selesaikan pembayaran tersebut atau batalkan terlebih dahulu untuk membuat tagihan baru.",
          activePaymentId: activePayment.id,
          existingPayment: activePayment,
          existingQrisData: qrisData
        }, { status: 409 });
      }
    }

    // Jika sampai sini, berarti tidak ada activePayment
    let payment;

    if (!payment) {
      let uniqueCode = 1;
      let totalWithCode = totalOriginalAmount;
      let isUsed = true;

      while (isUsed) {
        uniqueCode = Math.floor(Math.random() * 99) + 1;
        totalWithCode = totalOriginalAmount + uniqueCode;

        const conflict = await prisma.payment.findFirst({
          where: {
            totalAmount: totalWithCode,
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
        });

        if (!conflict) isUsed = false;
      }

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      payment = await prisma.payment.create({
        data: {
          userId: session.id,
          invoiceId: (targetInvoiceIds.length === 1 ? targetInvoiceIds[0] : null) as any,
          bulkInvoiceIds: (targetInvoiceIds.length > 1 ? bulkIdsStr : null) as any,
          originalAmount: totalOriginalAmount,
          uniqueCode: uniqueCode,
          totalAmount: totalWithCode,
          status: "PENDING",
          expiresAt: expiresAt,
        } as any,
      });
    }

    // Generate Dynamic QRIS berdasar totalAmount
    const qrisData = generateDynamicQRIS(STATIC_QRIS_TOKO_MULYA, payment.totalAmount);

    return NextResponse.json({ 
      success: true, 
      payment: payment,
      qrisData: qrisData
    });

  } catch (err: any) {
    console.error("Gagal membuat request pembayaran:", err);
    return NextResponse.json(
      { error: "Gagal memproses permintaan pembayaran." },
      { status: 500 }
    );
  }
}
