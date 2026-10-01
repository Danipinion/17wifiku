// app/(dashboard)/pelanggan/actions.ts
"use server";

import { auth, signOut } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt-ts";
import { revalidatePath } from "next/cache";

// Action untuk proses Logout
export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function changePasswordPelanggan(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Anda tidak terautentikasi." };
  }

  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password baru minimal harus 6 karakter." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Konfirmasi password tidak cocok." };
  }

  try {
    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });
    return { success: "Password berhasil diubah." };
  } catch (error) {
    return { error: "Gagal mengubah password." + error };
  }
}

// Action untuk mengirim form keluhan
export async function submitKeluhan(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Anda harus login untuk mengirim keluhan." };
  }

  const subject = formData.get("subject") as string;
  const description = formData.get("description") as string;

  if (!subject || !description) {
    return { error: "Judul dan deskripsi keluhan tidak boleh kosong." };
  }

  try {
    await prisma.complaint.create({
      data: {
        userId: session.user.id,
        subject,
        description,
        status: "OPEN", // Status default saat keluhan dibuat
      },
    });

    // Revalidate path untuk refresh data keluhan di halaman dashboard
    revalidatePath("/pelanggan");
    return { success: "Keluhan Anda berhasil dikirim." };
  } catch (error) {
    console.error("Gagal mengirim keluhan:", error);
    return { error: "Terjadi kesalahan pada server, gagal mengirim keluhan." };
  }
}
