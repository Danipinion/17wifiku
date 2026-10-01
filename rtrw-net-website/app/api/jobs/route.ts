import db from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      jobTypeId,
      date,
      evidence,
      adminPhoto,
      notes,
      latitude,
      longitude,
      targetLatitude,
      targetLongitude,
      instruction,
      status,
    } = body;

    if (!userId || !jobTypeId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const job = await db.job.create({
      data: {
        userId,
        jobTypeId,
        date: date ? new Date(date) : new Date(),
        evidence,
        adminPhoto,
        notes,
        latitude,
        longitude,
        targetLatitude,
        targetLongitude,
        instruction,
        status: status || "TODO",
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.log("[JOBS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    let whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (status) whereClause.status = status;

    const jobs = await db.job.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
          },
        },
        jobType: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.log("[JOBS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
