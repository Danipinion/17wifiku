import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

/**
 * GET: /api/mobile/admin/referral/candidates
 * Returns a list of potential referrers and referees.
 */
export async function GET(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const referrers = await prisma.user.findMany({
      where: { role: "PELANGGAN" },
      select: { id: true, name: true, phone: true, idNumber: true },
      orderBy: { name: "asc" },
    });

    const referees = await prisma.user.findMany({
      where: {
        role: "PELANGGAN",
        referralEntry: null, // Only those who are NOT already referees
      },
      select: { id: true, name: true, phone: true, idNumber: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ referrers, referees });
  } catch (err: any) {
    console.error("Gagal fetch candidate referrals admin:", err);
    return NextResponse.json({ error: "Gagal mengambil data calon referral" }, { status: 500 });
  }
}
