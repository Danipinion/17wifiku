import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

// POST: /api/mobile/tagihan/generate
export async function POST(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const month = parseInt(body.month as string);
    const year = parseInt(body.year as string);

    if (!month || !year) {
      return NextResponse.json(
        { error: "Bulan dan tahun harus diisi" },
        { status: 400 }
      );
    }

    const allPelanggan = await prisma.user.findMany({
      where: { role: "PELANGGAN", status: "ACTIVE" },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const pelanggan of allPelanggan) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { userId: pelanggan.id, month, year },
      });

      if (!existingInvoice) {
        const finalAmount = pelanggan.abonemen - pelanggan.potongan;
        await prisma.invoice.create({
          data: {
            userId: pelanggan.id,
            month,
            year,
            amount: finalAmount < 0 ? 0 : finalAmount,
            status: "UNPAID",
          },
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdCount} tagihan baru dibuat. ${skippedCount} dilewati.`,
      createdCount,
      skippedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal membuat tagihan massal: " + err.message },
      { status: 500 }
    );
  }
}
