// middleware.ts
import { auth } from "@/lib/auth"; // Import dari konfigurasi auth kita
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAuthPage = pathname === "/login";
  const isDashboardPage =
    pathname.startsWith("/admin") || pathname.startsWith("/pelanggan");

  if (isAuthPage) {
    if (isLoggedIn) {
      // Jika sudah login, redirect dari halaman login ke dashboard
      const role = req.auth?.user?.role;
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/pelanggan", req.url));
    }
    // Jika belum login, biarkan akses halaman login
    return null;
  }

  if (isDashboardPage) {
    if (!isLoggedIn) {
      // Jika belum login, redirect dari dashboard ke login
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Proteksi role-based
    const role = req.auth?.user?.role;
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      // Jika pelanggan mencoba akses /admin, redirect
      return NextResponse.redirect(new URL("/pelanggan", req.url));
    }
    if (pathname.startsWith("/pelanggan") && role !== "PELANGGAN") {
      // Jika admin mencoba akses /pelanggan, redirect
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Jika role cocok, izinkan akses
    return null;
  }

  return null;
});

// Konfigurasi matcher untuk menentukan path mana yang akan dijalankan oleh middleware
export const config = {
  matcher: ["/login", "/admin/:path*", "/pelanggan/:path*"],
};
