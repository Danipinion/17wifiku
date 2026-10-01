import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { invoiceIds } = body;

    if (!invoiceIds || !Array.isArray(invoiceIds)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await prisma.invoice.deleteMany({
      where: { id: { in: invoiceIds } },
    });

    return NextResponse.json({ success: true, count: invoiceIds.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal menghapus tagihan" },
      { status: 500 }
    );
  }
}
