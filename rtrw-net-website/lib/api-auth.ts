import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";

// Ambil secret yang sama
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

// Tipe data untuk payload token kita
interface AdminTokenPayload {
  id: string;
  role: Role;
  name: string;
  sid: string;
  iat: number;
  exp: number;
}

/**
 * Helper untuk memverifikasi token dan memastikan user adalah ADMIN.
 * Dipanggil di awal setiap API route yang terproteksi.
 */
export async function getAdminSession(
  request: NextRequest,
): Promise<
  | { session: AdminTokenPayload; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1]; // Ambil token dari "Bearer <token>"

  if (!token) {
    return {
      error: NextResponse.json({ error: "Token dibutuhkan" }, { status: 401 }),
    };
  }

  try {
    const { payload } = await jwtVerify<AdminTokenPayload>(token, secret);

    // Pastikan role-nya adalah ADMIN
    if (payload.role !== Role.ADMIN) {
      return {
        error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }),
      };
    }

    return { session: payload };
  } catch (error) {
    console.warn("Verifikasi JWT Gagal:", error);
    return {
      error: NextResponse.json({ error: "Token tidak valid" }, { status: 401 }),
    };
  }
}

/**
 * Helper untuk memverifikasi token dan memastikan user adalah ADMIN atau KARYAWAN.
 */
export async function getAuthSession(
  request: NextRequest,
): Promise<
  | { session: AdminTokenPayload; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ error: "Token dibutuhkan" }, { status: 401 }),
    };
  }

  try {
    const { payload } = await jwtVerify<AdminTokenPayload>(token, secret);

    // Karyawan dan Admin diizinkan
    if (payload.role !== Role.ADMIN && payload.role !== Role.KARYAWAN) {
      return {
        error: NextResponse.json({ error: "Akses ditolak" }, { status: 403 }),
      };
    }

    return { session: payload };
  } catch (error) {
    console.warn("Verifikasi JWT Gagal:", error);
    return {
      error: NextResponse.json({ error: "Token tidak valid" }, { status: 401 }),
    };
  }
}

/**
 * Helper untuk memverifikasi token tanpa batasan role.
 */
export async function getAnyAuthSession(
  request: NextRequest,
): Promise<
  | { session: AdminTokenPayload; error?: undefined }
  | { session?: undefined; error: NextResponse }
> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ error: "Token dibutuhkan" }, { status: 401 }),
    };
  }

  try {
    const { payload } = await jwtVerify<AdminTokenPayload>(token, secret);
    
    // Verifikasi session di database if it's a mobile session
    if (payload.sid) {
      const dbSession = await prisma.session.findUnique({
        where: { id: payload.sid }
      });
      
      if (!dbSession) {
        return {
          error: NextResponse.json({ error: "Sesi telah berakhir atau dikeluarkan" }, { status: 401 }),
        };
      }

      // Optional: Update lastActive
      await prisma.session.update({
        where: { id: payload.sid },
        data: { lastActive: new Date() }
      });
    }

    return { session: payload as AdminTokenPayload };
  } catch (error) {
    console.warn("Verifikasi JWT Gagal:", error);
    return {
      error: NextResponse.json({ error: "Token tidak valid" }, { status: 401 }),
    };
  }
}
