import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const sessionId = params.id;

    // Pastikan session milik user yang sedang login
    const sessionToMove = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionToMove || sessionToMove.userId !== session.id) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        title: "Sesi Keluar",
        content: `Perangkat ${sessionToMove.device || "tidak dikenal"} telah berhasil dikeluarkan dari akun Anda.`,
        type: "SYSTEM",
      }
    });

    return NextResponse.json({ success: true, message: "Perangkat berhasil dikeluarkan" });
  } catch (err: any) {
    console.error("Gagal delete session:", err);
    return NextResponse.json({ error: "Gagal mengeluarkan perangkat" }, { status: 500 });
  }
}
