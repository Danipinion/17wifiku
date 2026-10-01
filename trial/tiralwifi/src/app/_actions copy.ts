"use server";

import { PrismaClient } from "../generated/prisma/client";
import { RouterOSAPI } from "node-routeros";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

// Detail koneksi ke MikroTik Anda
const MIKROTIK_HOST = "192.168.78.113"; // IP MikroTik
const MIKROTIK_USER = "nextjs"; // User API
const MIKROTIK_PASS = "api123";

export async function claimTrial(formData: FormData) {
  const mac = formData.get("mac") as string;
  const ip = formData.get("ip") as string;

  console.log("Menerima request claimTrial untuk MAC:", mac, "IP:", ip);

  if (!mac || !ip) {
    return { error: "MAC Address atau IP tidak valid." };
  }

  const api = new RouterOSAPI({
    host: MIKROTIK_HOST,
    user: MIKROTIK_USER,
    password: MIKROTIK_PASS,
  });

  try {
    // --- 1. Cek Limit di Database ---
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const trialCount = await prisma.trialActivation.count({
      where: {
        macAddress: mac,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (trialCount >= 3) {
      return {
        error: "Maaf, Anda sudah menggunakan jatah trial 3x bulan ini.",
      };
    }

    // --- 2. Hubungkan ke MikroTik ---
    await api.connect();

    // --- 3. Beri Akses 15 Menit (Bypass) ---
    // PERBAIKAN 1: Path dan parameter digabung jadi satu array
    await api.write([
      "/ip/hotspot/ip-binding/add",
      "=type=bypassed",
      `=mac-address=${mac}`,
      `=comment=Trial-${trialCount + 1}`,
    ]);

    // Cari user aktif
    // PERBAIKAN 2: Path dan parameter digabung jadi satu array
    const [activeUser] = await api.write([
      "/ip/hotspot/active/print",
      "?mac-address=" + mac,
    ]);

    // Jika user sedang 'login' (status 'auth'), tendang dia
    if (activeUser) {
      // PERBAIKAN 3: Path dan parameter digabung jadi satu array
      await api.write([
        "/ip/hotspot/active/remove",
        "=.id=" + activeUser[".id"],
      ]);
    }

    // --- 4. Catat ke Database ---
    await prisma.trialActivation.create({
      data: {
        macAddress: mac,
      },
    });
  } catch (err: any) {
    console.error("Error saat aktivasi trial:", err);

    if (err.errno === "SOCKTMOUT" || err.code === "ETIMEDOUT") {
      return {
        error:
          "Gagal terhubung ke router (Timeout). Pastikan IP dan Firewall benar.",
      };
    }
    // Tangani error jika parameter masih salah
    if (
      err.message &&
      (err.message.includes("unknown parameter") ||
        err.message.includes("bad command"))
    ) {
      return { error: "Kesalahan internal (Perintah API salah)." };
    }
    return { error: "Gagal terhubung ke server. Coba beberapa saat lagi." };
  } finally {
    // --- 5. SELALU TUTUP KONEKSI ---
    if (api.connected) {
      await api.close();
    }
    await prisma.$disconnect();
  }

  // --- 6. Redirect ke Landing Page (Hanya jika SUKSES) ---
  redirect("http://192.168.78.101:3002");
}
