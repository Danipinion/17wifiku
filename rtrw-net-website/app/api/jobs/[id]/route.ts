import db from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status } = body;

    if (!id || !status) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const job = await db.job.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.log("[JOB_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const job = await db.job.findUnique({
      where: { id },
      include: { jobType: true },
    });
    if (!job) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json({
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
    });
  } catch (error) {
    console.log("[JOB_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
