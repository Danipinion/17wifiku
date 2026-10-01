import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

/**
 * POST: /api/mobile/payments/[paymentId]/cancel
 * User membatalkan permintaan pembayaran yang masih PENDING.
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: { paymentId: string } }
) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
    });

    if (!payment || payment.userId !== session.id) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Hanya pembayaran PENDING yang bisa dibatalkan" }, { status: 400 });
    }

    await prisma.payment.update({
      where: { id: params.paymentId },
      data: { status: "EXPIRED" } // Kita gunakan EXPIRED atau CANCELLED? EXPIRED praktis karena sama-sama mati.
    });

    return NextResponse.json({ success: true, message: "Pembayaran berhasil dibatalkan" });

  } catch (err: any) {
    console.error("Gagal membatalkan pembayaran:", err);
    return NextResponse.json({ error: "Gagal memproses pembatalan." }, { status: 500 });
  }
}
