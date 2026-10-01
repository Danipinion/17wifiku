import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { session, error } = await getAuthSession(request);
  if (error) return error;

  try {
    const userId = session.id;

    const url = new URL(request.url);
    const m = url.searchParams.get("month");
    const y = url.searchParams.get("year");

    let gte: Date;
    let lte: Date;

    if (m && y) {
      gte = new Date(parseInt(y), parseInt(m) - 1, 1);
      lte = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      gte = new Date(now.getFullYear(), now.getMonth(), 1);
      lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const [user] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        select: { baseSalary: true },
      }),
    ]);

    const baseSalary = user?.baseSalary || 0;

    const jobs = await prisma.job.findMany({
      where: {
        userId: userId,
        date: { gte, lte },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        jobType: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    const approvedJobs = jobs.filter((job) => job.status === "APPROVED");
    const totalIncome =
      baseSalary +
      approvedJobs.reduce((acc, job) => acc + job.jobType.price, 0);

    return NextResponse.json({
      baseSalary,
      totalIncome,
      historyJobs: jobs.map((job) => ({
        id: job.id,
        jobTypeName: job.jobType.name,
        price: job.jobType.price,
        status: job.status,
        date: job.date.toISOString(),
        notes: job.notes,
        evidence: job.evidence,
        latitude: job.latitude,
        longitude: job.longitude,
      })),
    });
  } catch (err: any) {
    console.error("Gagal fetch employee history:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data riwayat. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
