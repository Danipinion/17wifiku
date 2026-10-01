import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";
import { getGenieACSDevice, sendGenieACSTask } from "@/lib/genieacs";

export async function GET(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { genieacsDevices: true },
    });

    if (!user?.genieacsDevices || user.genieacsDevices.length === 0) {
      return NextResponse.json({ error: "Fitur tidak tersedia di akun Anda" }, { status: 403 });
    }

    const deviceId = request.nextUrl.searchParams.get("deviceId") || user.genieacsDevices[0].deviceId;
    const device = await getGenieACSDevice(deviceId);
    if (!device) {
      return NextResponse.json({ error: "Perangkat tidak ditemukan atau sedang offline" }, { status: 404 });
    }

    const anyDevice = device as any;
    
    // Extract relevant data
    const rxPower = anyDevice.VirtualParameters?.RXPower?._value || 
                    anyDevice.VirtualParameters?.RXpower?._value || 
                    "N/A";
    const temperature = anyDevice.VirtualParameters?.gettemp?._value || 
                        anyDevice.VirtualParameters?.GetTemp?._value || 
                        "N/A";
    const uptime = anyDevice.VirtualParameters?.getdeviceuptime?._value || 
                   anyDevice.VirtualParameters?.GetUptime?._value || 
                   "N/A";
    const productClass = anyDevice.DeviceID?.ProductClass?._value || 
                         anyDevice.InternetGatewayDevice?.DeviceInfo?.ProductClass?._value || 
                         anyDevice._deviceId?._ProductClass || 
                         "N/A";
    
    // SSID
    const ssid = anyDevice.InternetGatewayDevice?.LANDevice?.["1"]?.WLANConfiguration?.["1"]?.SSID?._value || 
                 anyDevice.InternetGatewayDevice?.WLANConfiguration?.["1"]?.SSID?._value || 
                 "SobatWiff";
    
    // IP
    const ip = anyDevice.InternetGatewayDevice?.WANDevice?.["1"]?.WANConnectionDevice?.["1"]?.WANIPConnection?.["1"]?.ExternalIPAddress?._value || 
               anyDevice.VirtualParameters?.pppoeIP?._value ||
               anyDevice.VirtualParameters?.IPTR069?._value || "N/A";

    // Connected Devices
    const hosts = anyDevice.InternetGatewayDevice?.LANDevice?.["1"]?.Hosts?.Host;
    const deviceList: any[] = [];
    if (hosts) {
      for (const key in hosts) {
        if (!isNaN(Number(key))) {
          const host = hosts[key];
          deviceList.push({
            name: host.HostName?._value || "Unknown Device",
            ip: host.IPAddress?._value || "0.0.0.0",
            mac: host.MACAddress?._value || "00:00:00:00:00:00"
          });
        }
      }
    }

    return NextResponse.json({
      model: productClass,
      uptime: uptime,
      temperature: temperature,
      rxPower: rxPower,
      ssid: ssid,
      ip: ip,
      connectedDevices: deviceList.length,
      deviceList: deviceList,
      currentDeviceId: deviceId,
      availableDevices: user.genieacsDevices.map(d => ({ 
        id: d.deviceId, 
        name: d.name || `Perangkat ${d.deviceId.slice(-4)}` 
      }))
    });
  } catch (err: any) {
    console.error("Gagal fetch router data:", err);
    return NextResponse.json({ error: "Gagal mengambil data router" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { genieacsDevices: true },
    });

    if (!user?.genieacsDevices || user.genieacsDevices.length === 0) {
      return NextResponse.json({ error: "Fitur tidak tersedia" }, { status: 403 });
    }

    const body = await request.json();
    const { action, password, deviceId: bodyDeviceId } = body;
    const deviceId = bodyDeviceId || user.genieacsDevices[0].deviceId;

    if (action === "reboot") {
      await sendGenieACSTask(deviceId, { name: "reboot" });
      return NextResponse.json({ success: true, message: "Perintah reboot berhasil dikirim" });
    }

    if (action === "change-password") {
      if (!password) {
        return NextResponse.json({ error: "Password baru wajib diisi" }, { status: 400 });
      }
      await sendGenieACSTask(deviceId, {
        name: "setParameterValues",
        parameterValues: [
          [
            "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase",
            password,
            "xsd:string",
          ],
        ],
      });
      return NextResponse.json({ success: true, message: "Password WiFi berhasil diubah" });
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    console.error("Gagal melakukan aksi router:", err);
    return NextResponse.json({ error: "Gagal melakukan aksi: " + err.message }, { status: 500 });
  }
}
