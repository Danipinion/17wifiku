import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

// GET not needed because it's in GET /profile
// But I'll provide it anyway if it helps
export async function PATCH(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { notifBilling, notifPromo } = body;

    const data: any = {};
    if (notifBilling !== undefined) data.notifBilling = !!notifBilling;
    if (notifPromo !== undefined) data.notifPromo = !!notifPromo;

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Tidak ada data yang diperbarui" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
    });

    return NextResponse.json({ 
        success: true, 
        message: "Pengaturan notifikasi berhasil diperbarui",
        notifications: {
            notifBilling: user.notifBilling,
            notifPromo: user.notifPromo
        }
    });
  } catch (err: any) {
    console.error("Gagal update notifikasi:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui pengaturan" },
      { status: 500 },
    );
  }
}
