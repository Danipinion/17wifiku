import db from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { name, price, description } = body;

    const jobType = await db.jobType.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        price: parseFloat(price),
        description,
      },
    });

    return NextResponse.json(jobType);
  } catch (error) {
    console.log("[JOB_TYPE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const jobType = await db.jobType.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json(jobType);
  } catch (error) {
    console.log("[JOB_TYPE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
