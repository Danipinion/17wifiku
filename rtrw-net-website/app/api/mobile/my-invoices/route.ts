import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

/**
 * GET: /api/mobile/my-invoices
 * Ambil semua riwayat tagihan untuk pelanggan yang sedang login.
 */
export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: session.id,
      },
      include: {
        payments: {
          where: {
            status: "PENDING",
            expiresAt: { gt: new Date() }
          },
          take: 1
        }
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ]
    });

    const formattedInvoices = invoices.map(inv => ({
      id: inv.id,
      amount: inv.amount,
      month: inv.month,
      year: inv.year,
      status: inv.status,
      paidAt: inv.paidAt,
      pdfUrl: inv.pdfUrl,
      isPaymentInProgress: inv.payments.length > 0
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (err: any) {
    console.error("Gagal fetch riwayat tagihan pelanggan:", err);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat tagihan" },
      { status: 500 }
    );
  }
}
