import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { UserStatus } from "@prisma/client";

// PATCH: /api/mobile/pelanggan/[id]/status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { status } = body;

    if (status !== UserStatus.ACTIVE && status !== UserStatus.INACTIVE) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const updatedPelanggan = await prisma.user.update({
      where: { id: params.id },
      data: { status: status },
    });

    const { password, ...safeData } = updatedPelanggan;
    return NextResponse.json(safeData);
  } catch (err) {
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}
