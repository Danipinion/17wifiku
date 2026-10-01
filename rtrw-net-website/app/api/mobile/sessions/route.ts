import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const sessions = await prisma.session.findMany({
      where: { userId: session.id },
      orderBy: { lastActive: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (err: any) {
    console.error("Gagal fetch sessions:", err);
    return NextResponse.json({ error: "Gagal mengambil riwayat perangkat" }, { status: 500 });
  }
}

// Logout from all other devices
export async function DELETE(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const currentSessionId = session.sid;

    await prisma.session.deleteMany({
      where: {
        userId: session.id,
        id: { not: currentSessionId },
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        title: "Keamanan Sesi",
        content: "Anda baru saja mengeluarkan semua perangkat lain dari akun Anda. Tindakan ini disarankan jika ada aktivitas mencurigakan.",
        type: "SYSTEM",
      }
    });

    return NextResponse.json({ success: true, message: "Berhasil keluar dari perangkat lain" });
  } catch (err: any) {
    console.error("Gagal delete sessions:", err);
    return NextResponse.json({ error: "Gagal mengeluarkan perangkat lain" }, { status: 500 });
  }
}
