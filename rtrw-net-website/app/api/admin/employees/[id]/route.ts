import db from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { name, email, phone, password, address, baseSalary } = body;

    const dataToUpdate: any = {
      name,
      username: email,
      phone,
      address,
      baseSalary: Number(baseSalary) || 0,
    };

    if (password) {
      dataToUpdate.password = await hash(password, 12);
    }

    const employee = await db.user.update({
      where: {
        id: params.id,
      },
      data: dataToUpdate,
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.log("[EMPLOYEE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const employee = await db.user.update({
      where: {
        id: params.id,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.log("[EMPLOYEE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
