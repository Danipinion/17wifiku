import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

// GET: /api/mobile/pelanggan/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const pelanggan = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        invoices: { 
          orderBy: [{ year: "desc" }, { month: "desc" }],
          take: 24 
        },
        complaints: { 
          orderBy: { createdAt: "desc" },
          take: 10
        },
        genieacsDevices: true,
        referralsMade: {
          include: {
            referee: { select: { id: true, name: true, phone: true, status: true } }
          },
          orderBy: { createdAt: "desc" }
        }
      },
    });

    if (!pelanggan) {
      return NextResponse.json(
        { error: "Pelanggan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate Referral Bonus (Total 5k for each APPROVED referral)
    const referralBonus = pelanggan.referralsMade
      .filter(ref => ref.status === "APPROVED")
      .reduce((sum, ref) => sum + ref.discount, 0);

    const { password, ...safeData } = pelanggan as any;
    
    // Explicitly add the bonus and rename fields for Android compatibility
    const finalData = {
      ...safeData,
      referralBonus,
      totalDiskon: safeData.potongan + referralBonus
    };

    return NextResponse.json(finalData);
  } catch (err) {
    console.error("Gagal ambil detail pelanggan:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data: " + (err as Error).message },
      { status: 500 }
    );
  }
}

// PUT: /api/mobile/pelanggan/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, phone, address, abonemen, potongan, action, deviceId, deviceName } = body;

    // Handle Device Actions (Link/Unlink/Rename) if action is provided
    if (action) {
      if (action === "link-device") {
        if (!deviceId) return NextResponse.json({ error: "Device ID wajib diisi" }, { status: 400 });
        await prisma.genieACSDevice.create({
          data: {
            deviceId,
            name: deviceName || "Ont Modem",
            userId: params.id
          }
        });
        return NextResponse.json({ message: "Modem berhasil di-link" });
      }

      if (action === "unlink-device") {
        if (!deviceId) return NextResponse.json({ error: "Device ID wajib diisi" }, { status: 400 });
        await prisma.genieACSDevice.delete({
          where: { deviceId }
        });
        return NextResponse.json({ message: "Modem berhasil di-unlink" });
      }

      if (action === "rename-device") {
        if (!deviceId || !deviceName) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
        await prisma.genieACSDevice.update({
          where: { deviceId },
          data: { name: deviceName }
        });
        return NextResponse.json({ message: "Label modem berhasil diubah" });
      }
    }

    // Normal Profile Update
    if (!name || !phone || abonemen == null) {
      return NextResponse.json(
        { error: "Data wajib tidak lengkap" },
        { status: 400 }
      );
    }

    const updatedPelanggan = await prisma.user.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        address: address || "",
        abonemen: parseFloat(abonemen) || 0,
        potongan: parseFloat(potongan) || 0,
      },
    });

    const { password, ...safeData } = updatedPelanggan;
    return NextResponse.json(safeData);
  } catch (err: any) {
    console.error("Gagal update/action pelanggan:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Nomor HP atau Device ID sudah digunakan" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal memproses permintaan: " + err.message },
      { status: 500 }
    );
  }
}
