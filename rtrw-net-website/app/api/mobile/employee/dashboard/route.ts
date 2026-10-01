import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  // 1. Proteksi route, membolehkan ADMIN dan KARYAWAN
  const { session, error } = await getAuthSession(request);
  if (error) return error;

  try {
    const userId = session.id;

    const [user] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: userId },
        select: { baseSalary: true },
      }),
    ]);

    const baseSalary = user?.baseSalary || 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const monthFilter = {
      gte: startOfMonth,
      lte: endOfMonth,
    };

    // Ambil statistik total pekerjaan yang harus dikerjakan (TODO)
    const todoJobs = await prisma.job.count({
      where: {
        userId: userId,
        status: "TODO",
      },
    });

    // Ambil statistik total pekerjaan yang belum selesai (PENDING) bulan ini
    const pendingJobs = await prisma.job.count({
      where: {
        userId: userId,
        status: "PENDING",
        date: monthFilter,
      },
    });

    // Ambil statistik total pekerjaan yang sudah disetujui/selesai (APPROVED) bulan ini
    const completedJobs = await prisma.job.count({
      where: {
        userId: userId,
        status: "APPROVED",
        date: monthFilter,
      },
    });

    // Semua job APPROVED bulan ini untuk estimasi gaji + gaji pokok
    const approvedJobsList = await prisma.job.findMany({
      where: { userId: userId, status: "APPROVED", date: monthFilter },
      select: { jobType: { select: { price: true } } },
    });
    const currentIncome =
      baseSalary +
      approvedJobsList.reduce((acc, job) => acc + job.jobType.price, 0);

    // Ambil 5 pekerjaan terakhir untuk ditampilkan di dashboard
    const recentJobs = await prisma.job.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Increased to show more including TODOs
      include: {
        jobType: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    return NextResponse.json({
      userName: session.name,
      statCards: {
        todoJobs,
        pendingJobs,
        completedJobs,
        totalJobs: todoJobs + pendingJobs + completedJobs,
        currentIncome,
      },
      recentJobs: recentJobs.map((job) => ({
        id: job.id,
        jobTypeName: job.jobType.name,
        price: job.jobType.price,
        status: job.status,
        date: job.date.toISOString(),
        instruction: job.instruction,
        notes: job.notes,
        evidence: job.evidence,
        adminPhoto: job.adminPhoto,
        latitude: job.latitude,
        longitude: job.longitude,
        targetLatitude: job.targetLatitude,
        targetLongitude: job.targetLongitude,
      })),
    });
  } catch (err: any) {
    console.error("Gagal fetch employee dashboard stats:", err);
    return NextResponse.json(
      {
        error:
          "Mohon maaf, terjadi kesalahan saat mengambil data dashboard. Silakan coba beberapa saat lagi.",
      },
      { status: 500 },
    );
  }
}
