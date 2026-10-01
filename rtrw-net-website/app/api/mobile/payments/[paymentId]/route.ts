import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

/**
 * GET: /api/mobile/payments/[paymentId]
 * Digunakan untuk polling oleh aplikasi SobatWiff
 * Cek status apakah pembayaran sudah diverifikasi oleh webhook atau belum.
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { paymentId: string } }
) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { invoice: true }
    });

    if (!payment || payment.userId !== session.id) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan" }, { status: 404 });
    }

    const isBulk = !payment.invoiceId;
    
    return NextResponse.json({ 
      id: payment.id,
      status: payment.status,
      totalAmount: payment.totalAmount,
      invoiceStatus: isBulk 
        ? (payment.status === "SUCCESS" ? "PAID" : "UNPAID")
        : payment.invoice?.status,
      paidAt: isBulk
        ? (payment.status === "SUCCESS" ? new Date() : null)
        : (payment.invoice?.status === "PAID" ? payment.invoice?.paidAt : null)
    });

  } catch (err: any) {
    console.error("Gagal ambil status pembayaran:", err);
    return NextResponse.json({ error: "Gagal memproses data." }, { status: 500 });
  }
}
