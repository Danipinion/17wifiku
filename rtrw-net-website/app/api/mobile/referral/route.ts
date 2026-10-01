import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

/**
 * GET: /api/mobile/referral
 * Returns the current user's referral code and a list of people they have referred.
 */
export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        referralCode: true,
        referralsMade: {
          include: {
            referee: {
              select: {
                idNumber: true,
                name: true,
                status: true,
                invoices: {
                  select: {
                    status: true,
                    month: true,
                    year: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // [BARU] Generate referral code if missing
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode },
      });
    }

    // Map the referrals to a cleaner format
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();

    const referrals = user.referralsMade.map((ref) => {
      const invoices = ref.referee.invoices;
      const arrearsCount = invoices.filter(
        (inv) => inv.status === "UNPAID",
      ).length;
      const isPaidThisMonth = invoices.some(
        (inv) =>
          inv.month === currentMonth &&
          inv.year === currentYear &&
          inv.status === "PAID",
      );

      return {
        id: ref.id,
        refereeName: ref.referee.name,
        refereeIdNumber: ref.referee.idNumber,
        status: ref.status, // PENDING, APPROVED, REJECTED
        paymentStatus: isPaidThisMonth ? "PAID" : "UNPAID",
        arrearsCount,
        createdAt: ref.createdAt,
      };
    });

    const totalBonus =
      referrals.filter(
        (r) => r.status === "APPROVED" && r.paymentStatus === "PAID",
      ).length * 10000;

    return NextResponse.json({
      referralCode,
      totalBonus,
      successfulCount: referrals.filter((r) => r.status === "APPROVED").length,
      referrals,
    });
  } catch (err: any) {
    console.error("Gagal fetch referral data:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data referral" },
      { status: 500 },
    );
  }
}

/**
 * POST: /api/mobile/referral
 * Submit a referral code (as the person being referred/referee).
 */
export async function POST(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Kode referral wajib diisi" },
        { status: 400 },
      );
    }

    // 1. Check if user already has a referral entry
    const existingEntry = await prisma.referral.findUnique({
      where: { refereeId: session.id },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "Anda sudah memasukkan kode referral sebelumnya" },
        { status: 400 },
      );
    }

    // 2. Find the referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Kode referral tidak valid" },
        { status: 404 },
      );
    }

    if (referrer.id === session.id) {
      return NextResponse.json(
        { error: "Anda tidak bisa menggunakan kode referral sendiri" },
        { status: 400 },
      );
    }

    // 3. Create a pending referral
    const newReferral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: session.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kode referral berhasil dikirim, menunggu persetujuan admin",
      referral: newReferral,
    });
  } catch (err: any) {
    console.error("Gagal submit referral code:", err);
    return NextResponse.json(
      { error: "Gagal memproses kode referral" },
      { status: 500 },
    );
  }
}
