import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth"; // Helper dari langkah sebelumnya
import { Prisma, Role, UserStatus } from "@prisma/client";
import { hash } from "bcrypt-ts";

// Helper untuk generate ID Pelanggan (dari actions.ts Anda)
async function generateNextIdNumber() {
  const lastPelanggan = await prisma.user.findFirst({
    where: { idNumber: { startsWith: "JINDE" } },
    orderBy: { idNumber: "desc" },
  });

  if (lastPelanggan && lastPelanggan.idNumber) {
    const lastNumber = parseInt(lastPelanggan.idNumber.replace("JINDE", ""));
    const newNumber = lastNumber + 1;
    return `JINDE${String(newNumber).padStart(4, "0")}`;
  }
  return "JINDE0001";
}

// GET: /api/mobile/pelanggan?search=...&status=...
export async function GET(request: NextRequest) {
  // 1. Proteksi route
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  // 2. Ambil search params
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search");
  const status = searchParams.get("status") as UserStatus | "ALL";

  // 3. Bangun query Prisma
  const where: Prisma.UserWhereInput = {
    role: Role.PELANGGAN,
  };

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    // 4. Ambil data
    const pelanggan = await prisma.user.findMany({
      where: where,
      orderBy: { createdAt: "desc" },
    });

    // Hapus password dari response
    const safePelanggan = pelanggan.map(({ password, ...rest }) => rest);

    return NextResponse.json(safePelanggan);
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data" },
      { status: 500 },
    );
  }
}

// POST: /api/mobile/pelanggan
export async function POST(request: NextRequest) {
  // 1. Proteksi route
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  // 2. Ambil body
  try {
    const body = await request.json();
    const { name, phone, address, abonemen, potongan } = body;

    if (!name || !phone || abonemen == null) {
      return NextResponse.json(
        { error: "Data wajib tidak lengkap" },
        { status: 400 },
      );
    }

    // 3. Adaptasi logika dari createPelanggan (actions.ts)
    const newIdNumber = await generateNextIdNumber();
    const hashedPassword = await hash("user1111", 10); // Password default

    const newPelanggan = await prisma.user.create({
      data: {
        name,
        phone,
        address: address || "",
        abonemen: parseFloat(abonemen) || 0,
        potongan: parseFloat(potongan) || 0,
        password: hashedPassword,
        role: Role.PELANGGAN,
        idNumber: newIdNumber,
        status: UserStatus.ACTIVE,
      },
    });

    const { password, ...safeData } = newPelanggan;
    return NextResponse.json(safeData, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Nomor HP sudah terdaftar" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat pelanggan" },
      { status: 500 },
    );
  }
}
