import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        idNumber: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        abonemen: true,
        latitude: true,
        longitude: true,
        notifBilling: true,
        notifPromo: true,
        genieacsDevices: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      genieacsDeviceId: user.genieacsDevices[0]?.deviceId || null
    });
  } catch (err: any) {
    console.error("Gagal fetch profile:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data profil" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Koordinat tidak lengkap" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.id,
        title: "Pembaruan Lokasi",
        content: "Koordinat rumah Anda telah berhasil diperbarui di sistem demi memudahkan tim teknis.",
        type: "SYSTEM",
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("Gagal update koordinat:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui lokasi: " + err.message },
      { status: 500 },
    );
  }
}
