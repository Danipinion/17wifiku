import db from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hash } from "bcrypt-ts";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, address, baseSalary } = body;

    if (!name || !email || !password || !phone) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const employee = await db.user.create({
      data: {
        name,
        username: email, // Using email as username for simplicity, or handle separately
        phone,
        password: hashedPassword,
        address,
        baseSalary: Number(baseSalary) || 0,
        role: "KARYAWAN",
        status: "ACTIVE",
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.log("[EMPLOYEES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    let dateFilter = {};
    if (monthParam && yearParam) {
      const month = parseInt(monthParam);
      const year = parseInt(yearParam);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      dateFilter = {
        gte: startDate,
        lt: endDate,
      };
    }

    const employees = await db.user.findMany({
      where: {
        role: "KARYAWAN",
        status: "ACTIVE",
      },
      include: {
        jobs: {
          where: {
            status: "APPROVED",
            ...(monthParam && yearParam ? { date: dateFilter } : {}),
          },
          include: {
            jobType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const employeesWithSalary = employees.map((emp) => {
      const completedJobsTotal = emp.jobs.reduce(
        (sum, job) => sum + (job.jobType?.price || 0),
        0,
      );
      const totalSalary = (emp.baseSalary || 0) + completedJobsTotal;

      const { jobs, ...empData } = emp;
      return {
        ...empData,
        completedJobsTotal,
        totalSalary,
      };
    });

    return NextResponse.json(employeesWithSalary);
  } catch (error) {
    console.log("[EMPLOYEES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
