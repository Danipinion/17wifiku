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
    // (BENAR) Menambahkan IP binding tanpa timeout
    await api.write([
      "/ip/hotspot/ip-binding/add",
      "=type=bypassed",
      `=mac-address=${mac}`,
      `=comment=Trial-${trialCount + 1}-${mac}`, // Tambahkan MAC di comment agar unik
    ]);

    // --- 3B. ALTERNATIF: Buat Script untuk 'Timeout' ---
    const scriptName = `TrialRemove-${mac}`;

    // Script ini akan:
    // 1. :delay 15m - Menunggu 15 menit
    // 2. /ip hotspot ip-binding remove ... - Menghapus binding berdasarkan MAC
    // 3. /system script remove ... - Menghapus dirinya sendiri
    const scriptSource =
      `:delay 1m; ` +
      `/ip hotspot ip-binding remove [find mac-address="${mac}"]; ` +
      `/system script remove [find name="${scriptName}"];`;

    // (Opsional tapi disarankan) Hapus script lama jika ada yang nyangkut
    // const [oldScript] = await api.write([
    //   "/system/script/print",
    //   `?name=${scriptName}`,
    // ]);
    // if (oldScript) {
    //   await api.write(["/system/script/remove", `=.id=${oldScript[".id"]}`]);
    // }

    // Buat script baru
    await api.write([
      "/system/script/add",
      `=name=${scriptName}`,
      `=source=${scriptSource}`,
      // Beri izin agar script bisa menghapus binding dan dirinya sendiri
      "=policy=read,write,test",
    ]);

    // Jalankan script
    await api.write(["/system/script/run", `=number=${scriptName}`]);
    // ---------------------------------------------------

    // Cari user aktif (jika ada) untuk ditendang
    // const [activeUser] = await api.write([
    //   "/ip/hotspot/active/print",
    //   "?mac-address=" + mac,
    // ]);

    // if (activeUser) {
    //   await api.write([
    //     "/ip/hotspot/active/remove",
    //     "=.id=" + activeUser[".id"],
    //   ]);
    // }

    // --- 4. Catat ke Database ---
    await prisma.trialActivation.create({
      data: {
        macAddress: mac,
      },
    });
  } catch (err: any) {
    console.error("Error saat aktivasi trial:", err);
    // ... (Error handling Anda sudah benar) ...
    if (err.errno === "SOCKTMOUT" || err.code === "ETIMEDOUT") {
      return {
        error:
          "Gagal terhubung ke router (Timeout). Pastikan IP dan Firewall benar.",
      };
    }
    if (err.message && err.message.includes("failure:")) {
      return { error: `Error dari MikroTik: ${err.message}` };
    }
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
