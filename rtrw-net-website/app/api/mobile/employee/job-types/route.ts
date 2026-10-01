import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // 1. Verifikasi Data Login
  const { session, error } = await getAuthSession(request);
  if (error) return error;

  try {
    const jobTypes = await prisma.jobType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      jobTypes: jobTypes.map((type) => ({
        id: type.id,
        name: type.name,
      })),
    });
  } catch (err: any) {
    console.error("Gagal mendapatkan Job Types:", err);
    return NextResponse.json(
      { error: "Maaf, terjadi kendala saat mengambil tipe pekerjaan." },
      { status: 500 },
    );
  }
}
