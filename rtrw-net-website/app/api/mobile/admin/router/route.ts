import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { getGenieACSDevice, getGenieACSDevices, sendGenieACSTask } from "@/lib/genieacs";

/**
 * GET: /api/mobile/admin/router
 * Admin view for ACS Management.
 */
export async function GET(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type"); // "customers-with-devices"
  const userId = searchParams.get("userId");
  const deviceId = searchParams.get("deviceId");
  const query = searchParams.get("search") || "";

  try {
    // 1. Get customers who have linked devices
    if (type === "customers-with-devices") {
      const customers = await prisma.user.findMany({
        where: {
          role: "PELANGGAN",
          genieacsDevices: { some: {} },
          name: { contains: query, mode: "insensitive" }
        },
        select: {
          id: true,
          name: true,
          phone: true,
          idNumber: true,
          genieacsDevices: {
            select: { deviceId: true, name: true }
          }
        },
        orderBy: { name: "asc" },
        take: 20
      });
      return NextResponse.json(customers);
    }

    // 2. Get available/unlinked devices from GenieACS
    if (type === "available-devices") {
      const linkedDevices = await prisma.genieACSDevice.findMany({ select: { deviceId: true } });
      const linkedIds = linkedDevices.map(d => d.deviceId);
      
      const allDevices = await getGenieACSDevices({}, [
        '_id', 
        'InternetGatewayDevice.DeviceInfo.ProductClass',
        'VirtualParameters.IPTR069',
        '_deviceId._ProductClass'
      ]);
      
      const available = allDevices
        .filter(device => !linkedIds.includes(device._id))
        .map(device => {
          const anyDevice = device as any;
          const ip = anyDevice.VirtualParameters?.IPTR069?._value || "IP N/A";
          const model = anyDevice.InternetGatewayDevice?.DeviceInfo?.ProductClass?._value || anyDevice._deviceId?._ProductClass || "Model N/A";
          return {
            deviceId: device._id,
            ip,
            model
          };
        });
        
      return NextResponse.json(available);
    }
    if (userId) {
      const userWithDevices = await prisma.user.findUnique({
        where: { id: userId },
        include: { genieacsDevices: true }
      });

      if (!userWithDevices || userWithDevices.genieacsDevices.length === 0) {
        return NextResponse.json({ error: "Pelanggan tidak memiliki perangkat" }, { status: 404 });
      }

      // Fetch real-time data for each device from GenieACS
      const devicesData = await Promise.all(
        userWithDevices.genieacsDevices.map(async (dev) => {
          const acsData = await getGenieACSDevice(dev.deviceId);
          if (!acsData) return { deviceId: dev.deviceId, name: dev.name, status: "OFFLINE" };

          const anyDevice = acsData as any;
          const rxPower = anyDevice.VirtualParameters?.RXPower?._value || 
                          anyDevice.VirtualParameters?.RXpower?._value || 
                          "N/A";
          const temperature = anyDevice.VirtualParameters?.gettemp?._value || 
                              anyDevice.VirtualParameters?.GetTemp?._value || 
                              "N/A";
          const uptime = anyDevice.VirtualParameters?.getdeviceuptime?._value || 
                         anyDevice.VirtualParameters?.GetUptime?._value || 
                         "N/A";
          
          const ssid = anyDevice.InternetGatewayDevice?.LANDevice?.["1"]?.WLANConfiguration?.["1"]?.SSID?._value || 
                       anyDevice.InternetGatewayDevice?.WLANConfiguration?.["1"]?.SSID?._value || 
                       "N/A";
          
          const ip = anyDevice.InternetGatewayDevice?.WANDevice?.["1"]?.WANConnectionDevice?.["1"]?.WANIPConnection?.["1"]?.ExternalIPAddress?._value || 
                     anyDevice.VirtualParameters?.pppoeIP?._value ||
                     anyDevice.VirtualParameters?.IPTR069?._value || "N/A";

          const hosts = anyDevice.InternetGatewayDevice?.LANDevice?.["1"]?.Hosts?.Host;
          const connectedDevices = [];
          if (hosts) {
            for (const key in hosts) {
              if (!isNaN(Number(key))) {
                const host = hosts[key];
                connectedDevices.push({
                  name: host.HostName?._value || "Unknown Device",
                  ip: host.IPAddress?._value || "0.0.0.0",
                  mac: host.MACAddress?._value || "00:00:00:00:00:00"
                });
              }
            }
          }

          return {
            deviceId: dev.deviceId,
            name: dev.name,
            status: "ONLINE",
            model: anyDevice.InternetGatewayDevice?.DeviceInfo?.ProductClass?._value || anyDevice._deviceId?._ProductClass || "N/A",
            rxPower,
            temperature,
            uptime,
            ssid,
            ip,
            connectedDevicesCount: connectedDevices.length,
            connectedDevices
          };
        })
      );

      return NextResponse.json(devicesData);
    }

    return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 });
  } catch (err: any) {
    console.error("Gagal fetch router admin info:", err);
    return NextResponse.json({ error: "Gagal mengambil data router" }, { status: 500 });
  }
}

/**
 * POST: /api/mobile/admin/router
 * Admin tasks for routers.
 */
export async function POST(request: NextRequest) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { action, deviceId, password } = body;

    if (!deviceId) return NextResponse.json({ error: "ID Perangkat wajib diisi" }, { status: 400 });

    if (action === "reboot") {
      await sendGenieACSTask(deviceId, { name: "reboot" });
      return NextResponse.json({ success: true, message: "Perintah reboot berhasil dikirim" });
    }

    if (action === "change-password") {
      if (!password) return NextResponse.json({ error: "Password baru wajib diisi" }, { status: 400 });
      
      // Try multiple possible paths for WiFi password change
      const parameterValues = [
        ["InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", password, "xsd:string"],
        ["InternetGatewayDevice.WLANConfiguration.1.PreSharedKey.1.PreSharedKey", password, "xsd:string"]
      ];

      for (const [path, val, type] of parameterValues) {
        try {
           await sendGenieACSTask(deviceId, {
            name: "setParameterValues",
            parameterValues: [[path, val, type]]
          });
        } catch (e) {}
      }
      
      return NextResponse.json({ success: true, message: "Perintah ganti password WiFi berhasil dikirim" });
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    console.error("Gagal melakukan aksi router admin:", err);
    return NextResponse.json({ error: "Gagal melakukan aksi: " + err.message }, { status: 500 });
  }
}
