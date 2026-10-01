import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";
import { hash, compare } from "bcrypt-ts";

export async function PATCH(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "Password lama dan baru dibutuhkan" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const isPasswordValid = await compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.id },
      data: { password: hashedPassword },
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        title: "Keamanan Akun",
        content: "Password Anda baru saja diperbarui. Jika ini bukan Anda, hubungi tim dukungan kami segera.",
        type: "SYSTEM",
      }
    });

    return NextResponse.json({ success: true, message: "Password berhasil diperbarui" });
  } catch (err: any) {
    console.error("Gagal update password:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui password" },
      { status: 500 },
    );
  }
}
