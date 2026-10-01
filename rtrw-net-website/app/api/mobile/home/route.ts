import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        abonemen: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Get oldest unpaid invoice
    const oldestUnpaidInvoice = await prisma.invoice.findFirst({
      where: {
        userId: session.id,
        status: "UNPAID",
      },
      orderBy: [
        { year: "asc" },
        { month: "asc" },
      ],
      include: {
        payments: {
          where: {
            status: "PENDING",
            expiresAt: { gt: new Date() }
          },
          take: 1
        }
      }
    });

    const formattedInvoice = oldestUnpaidInvoice ? {
      ...oldestUnpaidInvoice,
      isPaymentInProgress: oldestUnpaidInvoice.payments.length > 0,
      payments: undefined // Clean up
    } : null;

    const now = new Date();

    // Get active announcements within schedule
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedAnnouncements = announcements.map(ann => ({
      ...ann,
      startDate: ann.startDate.toISOString(),
      endDate: ann.endDate ? ann.endDate.toISOString() : null,
    }));

    return NextResponse.json({
      user: {
        name: user.name,
        abonemen: user.abonemen,
      },
      oldestUnpaidInvoice: formattedInvoice,
      announcements: formattedAnnouncements,
    });
  } catch (err: any) {
    console.error("Gagal fetch home data:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data home" },
      { status: 500 },
    );
  }
}
