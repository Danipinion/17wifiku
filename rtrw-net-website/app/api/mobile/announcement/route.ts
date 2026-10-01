import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(announcements);
  } catch (err: any) {
    console.error("Gagal fetch announcement:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data pengumuman" },
      { status: 500 },
    );
  }
}
