import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare } from "bcrypt-ts";
import { SignJWT } from "jose";
import { Role } from "@prisma/client";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET tidak diatur di environment variables");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, app } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Identifier dan password dibutuhkan" },
        { status: 400 },
      );
    }

    // 1. Cari user berdasarkan username atau phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { phone: identifier }],
      },
    });

    // 2. Cek user, password, status, dan role
    if (!user || !user.password) {
      return NextResponse.json({ error: "Kredensial salah" }, { status: 401 });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Kredensial salah" }, { status: 401 });
    }

    // Batasan akses berdasarkan nama aplikasi
    if (app === "netown" && user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Akses ditolak, Net Own hanya untuk admin" },
        { status: 403 },
      );
    }

    if (app === "laporpak" && user.role !== Role.KARYAWAN) {
      return NextResponse.json(
        { error: "Akses ditolak, Lapor Pak hanya untuk teknisi / karyawan" },
        { status: 403 },
      );
    }

    // Fallback jika tidak ada parameter app, setidaknya pastikan bukan pelanggan
    if (!app && user.role !== Role.ADMIN && user.role !== Role.KARYAWAN) {
      return NextResponse.json(
        { error: "Akses ditolak, hanya untuk admin dan karyawan" },
        { status: 403 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
    }

    // 3. Buat/Update Session di Database
    const userAgent = request.headers.get("user-agent") || "Unknown Device";
    let ip = request.headers.get("x-forwarded-for") || "0.0.0.0";
    if (ip.includes(",")) ip = ip.split(",")[0].trim(); // Get real IP behind proxy
    
    // Simple Geolocation based on IP (Real functionality, not formality)
    let location = "Unknown Location";
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`);
      const geoData = await geoResponse.json();
      if (geoData.status === "success") {
        location = `${geoData.city}, ${geoData.country}`;
      }
    } catch (e) {
      console.warn("Gagal fetch geoIP:", e);
    }

    // Extract device details from body or fallback to User-Agent
    const { deviceId, deviceName, location: clientLocation } = body;
    let device = deviceName || "Mobile App";
    if (!deviceName) {
      if (userAgent.includes("Android")) device = "Android Device";
      else if (userAgent.includes("iPhone")) device = "iPhone";
      else if (userAgent.includes("Windows")) device = "Windows PC";
      else if (userAgent.includes("Macintosh")) device = "Mac";
    }

    // Use upsert to prevent duplicates for the same deviceId
    // If deviceId is null, it will effectively create a new session
    const sessionData = {
      userId: user.id,
      deviceId: deviceId || null,
      device: device,
      userAgent: userAgent,
      ip: ip,
      location: clientLocation || location,
      lastActive: new Date(),
    };

    let sessionRecord;
    if (deviceId) {
      sessionRecord = await prisma.session.upsert({
        where: {
          userId_deviceId: {
            userId: user.id,
            deviceId: deviceId,
          },
        },
        update: sessionData,
        create: sessionData,
      });
    } else {
      sessionRecord = await prisma.session.create({
        data: sessionData,
      });
    }

    // 4. Buat JWT Token dengan session id
    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      name: user.name,
      sid: sessionRecord.id, // Include session id
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(secret);

    // 5. Kembalikan token dan data user
    return NextResponse.json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
