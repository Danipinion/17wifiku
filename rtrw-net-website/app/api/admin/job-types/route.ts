import db from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description } = body;

    if (!name || !price) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const jobType = await db.jobType.create({
      data: {
        name,
        price: parseFloat(price),
        description,
      },
    });

    return NextResponse.json(jobType);
  } catch (error) {
    console.log("[JOB_TYPES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const jobTypes = await db.jobType.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(jobTypes);
  } catch (error) {
    console.log("[JOB_TYPES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
