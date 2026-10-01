import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";

/**
 * GET: /api/mobile/admin/referral
 * Returns all referrals with pagination, search, and status filter.
 */
export async function GET(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { referrer: { name: { contains: query, mode: "insensitive" } } },
      { referee: { name: { contains: query, mode: "insensitive" } } },
    ];
  }
  if (status !== "ALL") {
    whereClause.status = status;
  }

  try {
    const referrals = await prisma.referral.findMany({
      where: whereClause,
      include: {
        referrer: { select: { id: true, name: true, phone: true } },
        referee: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalCount = await prisma.referral.count({ where: whereClause });
    const hasMore = page * limit < totalCount;

    return NextResponse.json({ referrals, hasMore });
  } catch (err: any) {
    console.error("Gagal fetch referrals admin:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data referral" },
      { status: 500 },
    );
  }
}

/**
 * PATCH: /api/mobile/admin/referral
 * Update referral status (Approve/Reject).
 */
export async function PATCH(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { referralId, status } = body;

    if (!referralId || !status) {
      return NextResponse.json(
        { error: "ID dan status wajib diisi" },
        { status: 400 },
      );
    }

    const ref = await prisma.referral.update({
      where: { id: referralId },
      data: { status },
      include: { referrer: true, referee: true },
    });

    if (status === "APPROVED") {
      await prisma.notification.create({
        data: {
          userId: ref.referrerId,
          title: "Referral Disetujui",
          content: `Referral untuk teman Anda (${ref.referee.name}) telah disetujui! Anda akan mendapatkan potongan jika teman Anda lunas tagihan bulanannya.`,
          type: "PROMO",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Referral berhasil ${status.toLowerCase()}`,
    });
  } catch (err: any) {
    console.error("Gagal update referral status admin:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui status referral" },
      { status: 500 },
    );
  }
}

/**
 * POST: /api/mobile/admin/referral
 * Create manual referral.
 */
export async function POST(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { referrerId, refereeId } = body;

    if (!referrerId || !refereeId) {
      return NextResponse.json(
        { error: "Referrer dan Referee wajib dipilih" },
        { status: 400 },
      );
    }

    if (referrerId === refereeId) {
      return NextResponse.json(
        { error: "Pelanggan tidak bisa merujuk dirinya sendiri" },
        { status: 400 },
      );
    }

    // 1. Check if potential referee already has a recruiter
    const existing = await prisma.referral.findUnique({
      where: { refereeId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Pelanggan tujuan sudah terhubung ke referral lain" },
        { status: 400 },
      );
    }

    // 2. LOOP DETECTION (No circular referrals)
    // We check if the potential referee (Target) is an ancestor of the potential referrer (Source).
    // Traversal up the referral tree.
    let currentSourceId = referrerId;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loop safety

    while (currentSourceId && iterations < maxIterations) {
      // Find who recruited the current source
      const recruiter = await prisma.referral.findUnique({
        where: { refereeId: currentSourceId },
      });

      if (!recruiter) break; // Reached the top of the chain

      if (recruiter.referrerId === refereeId) {
        return NextResponse.json(
          {
            error:
              "Pelanggan tujuan adalah orang yang mengenalkan dari pengajak ini.",
          },
          { status: 400 },
        );
      }

      currentSourceId = recruiter.referrerId;
      iterations++;
    }

    const newReferral = await prisma.referral.create({
      data: {
        referrerId,
        refereeId,
        status: "APPROVED",
        discount: 10000,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Referral manual berhasil ditambahkan",
      referral: newReferral,
    });
  } catch (err: any) {
    console.error("Gagal create manual referral admin:", err);
    return NextResponse.json(
      { error: "Gagal membuat referral manual" },
      { status: 500 },
    );
  }
}
