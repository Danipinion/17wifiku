"use server";

import { PrismaClient } from "../generated/prisma/client";
import { RouterOSAPI } from "node-routeros";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

const MIKROTIK_HOST = "192.168.78.113";
const MIKROTIK_USER = "nextjs";
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyCount = await prisma.trialActivation.count({
      where: {
        macAddress: mac,
        createdAt: {
          gte: today,
        },
      },
    });

    if (dailyCount > 0) {
      return {
        error:
          "Maaf, Anda sudah menggunakan jatah trial hari ini (1x per hari).",
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const monthlyCount = await prisma.trialActivation.count({
      where: {
        macAddress: mac,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    if (monthlyCount >= 3) {
      return {
        error: "Maaf, Anda sudah menggunakan jatah trial 3x bulan ini.",
      };
    }

    await prisma.trialActivation.create({
      data: {
        macAddress: mac,
      },
    });

    await api.connect();

    await api.write([
      "/ip/hotspot/ip-binding/add",
      "=type=bypassed",
      `=mac-address=${mac}`,

      `=comment=Trial-${monthlyCount + 1}-${mac}`,
    ]);

    const scriptName = `TrialRemove-${mac}`;
    const scriptSource =
      `:delay 1m; ` +
      `/ip hotspot ip-binding remove [find mac-address="${mac}"]; ` +
      `/system script remove [find name="${scriptName}"];`;

    const [oldScript] = await api.write([
      "/system/script/print",
      `?name=${scriptName}`,
    ]);
    if (oldScript) {
      await api.write(["/system/script/remove", `=.id=${oldScript[".id"]}`]);
    }

    await api.write([
      "/system/script/add",
      `=name=${scriptName}`,
      `=source=${scriptSource}`,
      "=policy=read,write,test",
    ]);

    await api.write(["/system/script/run", `=number=${scriptName}`]);

    const [activeUser] = await api.write([
      "/ip/hotspot/active/print",
      "?mac-address=" + mac,
    ]);

    if (activeUser) {
      await api.write([
        "/ip/hotspot/active/remove",
        "=.id=" + activeUser[".id"],
      ]);
    }
  } catch (err: any) {
    console.error("Error saat aktivasi trial:", err);
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
    if (api.connected) {
      await api.close();
    }
    await prisma.$disconnect();
  }

  redirect("http://192.168.78.101:3002");
}
