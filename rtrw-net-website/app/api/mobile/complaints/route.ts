import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await getAdminSession(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const query = searchParams.get("query");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { user: { name: { contains: query, mode: "insensitive" } } },
      { subject: { contains: query, mode: "insensitive" } },
    ];
  }
  if (status) whereClause.status = status;

  try {
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    });

    return NextResponse.json(
      complaints.map((c) => ({
        id: c.id,
        subject: c.subject,
        description: c.description,
        userName: c.user.name,
        userPhone: c.user.phone,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status)
      return NextResponse.json(
        { error: "Missing ID or Status" },
        { status: 400 },
      );

    const updated = await prisma.complaint.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, status: updated.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
