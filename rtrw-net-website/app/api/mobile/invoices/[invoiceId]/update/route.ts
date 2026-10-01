import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { amount } = body;

    const updated = await prisma.invoice.update({
      where: { id: params.invoiceId },
      data: { amount: parseFloat(amount) },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Gagal update tagihan" },
      { status: 500 }
    );
  }
}
