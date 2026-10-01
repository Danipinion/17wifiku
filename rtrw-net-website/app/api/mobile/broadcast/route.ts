import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { sendWhatsAppMessage } from "@/lib/billingHelpers";

export async function POST(request: NextRequest) {
  const { error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { message, target } = body;

    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Pesan terlalu pendek." },
        { status: 400 },
      );
    }

    let whereClause: any = { role: "PELANGGAN" };
    if (target === "ACTIVE") whereClause.status = "ACTIVE";
    if (target === "INACTIVE") whereClause.status = "INACTIVE";

    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: { id: true, name: true, phone: true },
    });

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada penerima." },
        { status: 400 },
      );
    }

    let successCount = 0;
    // For mobile API, we might want to do this asynchronously or provide a quick response
    // But since the user wants it integrated, we'll follow the server action pattern
    const sendPromises = recipients.map(async (user) => {
      try {
        const result = await sendWhatsAppMessage(user.phone, message);
        if (result.success) successCount++;
        return result;
      } catch (err) {
        return { success: false };
      }
    });

    await Promise.all(sendPromises);

    await prisma.broadcastLog.create({
      data: {
        message,
        target,
        recipientCount: recipients.length,
        successCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Terkirim ke ${successCount} dari ${recipients.length} penerima.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { error } = await getAdminSession(request);
  if (error) return error;

  try {
    const history = await prisma.broadcastLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json(history);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
