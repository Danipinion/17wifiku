import prisma from "./prisma";
import { getGenieACSDevices } from "./genieacs";
import { sendWhatsAppMessage } from "./billingHelpers";

// Configuration
const OFFLINE_THRESHOLD_MINUTES = 5;
const REDAMAN_THRESHOLD = -27;
const CENTRAL_ISSUE_THRESHOLD_PERCENT = 15;
const MIN_DEVICES_FOR_CENTRAL_ISSUE = 10;

/**
 * Assistant-style message templates with Mulya Guard branding
 */
const templates = {
  // Template untuk konsolidasi banyak perangkat dalam 1 pesan
  consolidated: (
    name: string,
    phone: string,
    items: {
      status: string;
      deviceName: string;
      deviceId: string;
      rx?: number;
    }[],
  ) => {
    const time = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });

    let deviceDetails = "";
    let overallStatus = "🔴 OFFLINE";
    let analysis = "";
    let actions = "";

    const hasCriticalSinyal = items.some((i) => i.status === "high_redaman");
    const hasOffline = items.some((i) => i.status === "offline");

    if (hasCriticalSinyal && !hasOffline)
      overallStatus = "⚠️ PERINGATAN TEKNIS";
    if (hasCriticalSinyal && hasOffline)
      overallStatus = "🔴 OFFLINE & ⚠️ TEKNIS";

    items.forEach((item, index) => {
      deviceDetails += `\n*Perangkat ${index + 1}:*\n`;
      deviceDetails += `📍 Nama: ${item.deviceName || "Router"}\n`;
      deviceDetails += `🆔 ID: ${item.deviceId}\n`;
      deviceDetails += `📊 Status: ${item.status === "offline" ? "🔴 Offline" : "⚠️ Sinyal Lemah"}\n`;
      if (item.rx) deviceDetails += `📉 Redaman: ${item.rx} dBm\n`;
    });

    if (hasOffline) {
      analysis += `\n🔍 Penyebab: Terdeteksi perangkat terputus koneksi (Mati lampu/Kabel putus).`;
      actions += `\n- Cek ketersediaan listrik & hubungi pelanggan.`;
    }
    if (hasCriticalSinyal) {
      analysis += `\n🔍 Penyebab: Redaman tinggi. Indikasi kabel kotor atau jalur ODP bermasalah.`;
      actions += `\n- Jadwalkan pengecekan jalur kabel/ODP.`;
    }

    return `
📢 *LAPORAN MONITORING ASISTEN*
--------------------------------------------
Status: ${overallStatus}
Waktu: ${time}

*Informasi Pelanggan:*
👤 Nama: ${name}
📞 No. WA: ${phone}
${deviceDetails}
*Analisis Masalah:*${analysis}

*Tindakan Disarankan:*${actions}
--------------------------------------------
_Sistem Otomatis Mulya Guard_
    `.trim();
  },

  backOnline: (name: string, deviceName: string, deviceId: string) => {
    const time = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `
✅ *LAPORAN MONITORING ASISTEN*
--------------------------------------------
Status: 🟢 *ONLINE KEMBALI*
Waktu: ${time}

*Informasi Pelanggan:*
👤 Nama: ${name}
📍 Nama Perangkat: ${deviceName || "Router Pelanggan"}
🆔 Device ID: ${deviceId}

*Analisis:*
Alhamdulillah Boss! Perangkat yang sebelumnya terdeteksi offline kini sudah *Aktif* dan bisa digunakan kembali. ⚡
--------------------------------------------
_Sistem Otomatis Mulya Guard_
    `.trim();
  },

  centralIssue: (count: number) => {
    const time = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });
    return `
🚨 *GANGGUAN MASAL TERDETEKSI* 🚨
--------------------------------------------
Waktu: ${time}
Jumlah Perangkat: *${count} device*

Waduh Boss, sepertinya ada *Gangguan Masal* nih. Ada sekitar ${count} device yang offline bersamaan. Sepertinya ada masalah di pusat distribusi atau OLT. 

Saya stop kirim notif satuan dulu ya biar Boss gak pusing sama spam. 

Semangat perbaikannya Boss! 🛠️
--------------------------------------------
_Sistem Otomatis Mulya Guard_
    `.trim();
  },

  resolvedCentralIssue: () =>
    `Lapor Boss, gangguan masal sepertinya sudah mulai teratasi. Banyak device yang sudah kembali online. Saya kembali ke mode pantauan normal ya Boss! 🛡️`,
};

export async function runMonitoring() {
  console.log(
    `[${new Date().toISOString()}] Memulai pengecekan rutin via Cron...`,
  );

  try {
    const waGroupId = process.env.WA_ALERTS_GROUP_ID;
    if (!waGroupId) {
      console.warn(
        "⚠️ WA_ALERTS_GROUP_ID belum diset di .env, tidak bisa mengirim alert.",
      );
      return;
    }

    // 1. Fetch persistent states and data
    const allStates = await prisma.monitorState.findMany();
    const stateMap = new Map(allStates.map((s) => [s.deviceId, s]));

    let globalState = await prisma.globalMonitorState.findUnique({
      where: { id: 1 },
    });
    if (!globalState) {
      globalState = await prisma.globalMonitorState.create({
        data: { id: 1, isMassOutage: false },
      });
    }

    const linkedDevices = await prisma.genieACSDevice.findMany({
      include: { user: true },
    });

    if (linkedDevices.length === 0) return;

    // 2. Fetch from GenieACS
    const genieDevices = await getGenieACSDevices({}, [
      "_id",
      "VirtualParameters.RXPower",
      "_lastInform",
    ]);

    const genieMap = new Map(genieDevices.map((d) => [d._id, d]));
    const now = Date.now();

    const offlineItems: any[] = [];
    const pendingAlertsByUser = new Map<string, { user: any; items: any[] }>();

    // 3. Analyze each device
    for (const link of linkedDevices) {
      const genie = genieMap.get(link.deviceId);
      if (!genie) continue;

      const lastInform = new Date(genie._lastInform as any).getTime();
      const isOffline =
        now - lastInform > OFFLINE_THRESHOLD_MINUTES * 60 * 1000;

      const rxPowerStr = genie.VirtualParameters?.RXPower?._value;
      const rxPower = rxPowerStr ? parseFloat(rxPowerStr) : null;

      const prevState = stateMap.get(link.deviceId);
      const currentStatus = isOffline
        ? "offline"
        : rxPower !== null && rxPower < REDAMAN_THRESHOLD
          ? "high_redaman"
          : "online";

      if (isOffline) {
        offlineItems.push({ link, currentStatus });
      }

      // Check for state change transitions
      if (!prevState || prevState.lastStatus !== currentStatus) {
        if (currentStatus === "online") {
          // Hanya kirim Back Online jika transisi dari offline dan tidak sedang gangguan masal
          if (
            prevState &&
            prevState.lastStatus === "offline" &&
            !globalState.isMassOutage
          ) {
            await sendWhatsAppMessage(
              waGroupId,
              templates.backOnline(
                link.user.name,
                link.name || "",
                link.deviceId,
              ),
            );
          }
        } else if (!globalState.isMassOutage) {
          // Status offline atau high_redaman -> Kumpulkan untuk konsolidasi per user
          if (!pendingAlertsByUser.has(link.userId)) {
            pendingAlertsByUser.set(link.userId, {
              user: link.user,
              items: [],
            });
          }
          pendingAlertsByUser.get(link.userId)!.items.push({
            status: currentStatus,
            deviceName: link.name || "Router Pelanggan",
            deviceId: link.deviceId,
            rx: rxPower,
          });
        }

        // Update persistent state di DB
        await prisma.monitorState.upsert({
          where: { deviceId: link.deviceId },
          update: {
            lastStatus: currentStatus,
            lastRedaman: rxPower,
            lastAlertedAt: new Date(),
          },
          create: {
            deviceId: link.deviceId,
            lastStatus: currentStatus,
            lastRedaman: rxPower,
            lastAlertedAt: new Date(),
          },
        });
      }
    }

    // 4. Mass Outage detection
    const offlineCount = offlineItems.length;
    const totalCount = linkedDevices.length;
    const offlinePercent = (offlineCount / totalCount) * 100;
    const isCurrentlyMassOutage =
      offlineCount >= MIN_DEVICES_FOR_CENTRAL_ISSUE &&
      (offlinePercent >= CENTRAL_ISSUE_THRESHOLD_PERCENT || offlineCount >= 10);

    if (isCurrentlyMassOutage) {
      if (!globalState.isMassOutage) {
        await prisma.globalMonitorState.update({
          where: { id: 1 },
          data: { isMassOutage: true, lastMassOutageAt: new Date() },
        });
        await sendWhatsAppMessage(
          waGroupId,
          templates.centralIssue(offlineCount),
        );
      }
    } else {
      if (globalState.isMassOutage) {
        await prisma.globalMonitorState.update({
          where: { id: 1 },
          data: { isMassOutage: false },
        });
        await sendWhatsAppMessage(waGroupId, templates.resolvedCentralIssue());
      }

      // Kirim alert individu yang sudah dikonsolidasi per user
      for (const [userId, data] of pendingAlertsByUser.entries()) {
        await sendWhatsAppMessage(
          waGroupId,
          templates.consolidated(data.user.name, data.user.phone, data.items),
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in Cron monitoring:", error);
  } finally {
    await prisma.$disconnect();
  }
}
