import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (err: any) {
    console.error("Gagal fetch notifications:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data notifikasi" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
    const { session, error } = await getAnyAuthSession(request);
    if (error) return error;

    try {
        const body = await request.json();
        const { id } = body;

        if (id) {
            // Mark single as read
            await prisma.notification.update({
                where: { id, userId: session.id },
                data: { isRead: true }
            });
        } else {
            // Mark all as read
            await prisma.notification.updateMany({
                where: { userId: session.id, isRead: false },
                data: { isRead: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Gagal update notifications:", err);
        return NextResponse.json(
            { error: "Gagal memperbarui notifikasi" },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    const { session, error } = await getAnyAuthSession(request);
    if (error) return error;

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            await prisma.notification.delete({
                where: { id, userId: session.id }
            });
        } else {
            await prisma.notification.deleteMany({
                where: { userId: session.id }
            });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Gagal hapus notifications:", err);
        return NextResponse.json(
            { error: "Gagal menghapus notifikasi" },
            { status: 500 },
        );
    }
}
