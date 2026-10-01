const GENIEACS_URL = process.env.GENIEACS_URL || 'http://10.0.0.40:7557';

export interface GenieACSDevice {
  _id: string;
  _lastInform: string;
  _deviceId?: {
    _ProductClass: string;
  };
  VirtualParameters?: {
    RXPower?: { _value: string };
    gettemp?: { _value: string };
    getdeviceuptime?: { _value: string };
    IPTR069?: { _value: string };
    RXpower?: { _value: string };
    GetTemp?: { _value: string };
    GetUptime?: { _value: string };
    pppoeIP?: { _value: string };
  };
  DeviceID?: {
    ProductClass?: { _value: string };
  };
  InternetGatewayDevice?: {
    DeviceInfo?: {
      ProductClass?: { _value: string };
    };
    WANDevice?: Record<string, any>;
  };
}

export async function getGenieACSDevices(query: object = {}, projection: string[] = ['_id', '_lastInform', '_deviceId._ProductClass', 'InternetGatewayDevice.DeviceInfo.ProductClass']) {
  const params = new URLSearchParams();
  params.append('query', JSON.stringify(query));
  params.append('projection', projection.join(','));

  try {
    const response = await fetch(`${GENIEACS_URL}/devices?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 0 }, // No caching for real-time monitoring
    });

    if (!response.ok) {
      throw new Error(`GenieACS API error: ${response.statusText}`);
    }

    return await response.json() as GenieACSDevice[];
  } catch (error) {
    console.error('Error fetching from GenieACS:', error);
    return [];
  }
}

export async function getGenieACSDevice(deviceId: string) {
  const projection = [
    '_id',
    '_deviceId._ProductClass',
    'VirtualParameters.RXPower',
    'VirtualParameters.gettemp',
    'VirtualParameters.getdeviceuptime',
    'VirtualParameters.IPTR069',
    'VirtualParameters.RXpower',
    'VirtualParameters.GetTemp',
    'VirtualParameters.GetUptime',
    'InternetGatewayDevice.DeviceInfo.ProductClass',
    'InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.ExternalIPAddress',
    'InternetGatewayDevice.WLANConfiguration.1.SSID',
    'InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID',
    'InternetGatewayDevice.LANDevice.1.Hosts.Host',
    'VirtualParameters.pppoeIP'
  ];
  
  const devices = await getGenieACSDevices({ _id: deviceId }, projection);
  return devices.length > 0 ? devices[0] : null;
}

export async function sendGenieACSTask(deviceId: string, task: object) {
  try {
    const response = await fetch(`${GENIEACS_URL}/devices/${encodeURIComponent(deviceId)}/tasks?connection_request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GenieACS task error: ${response.status} ${errorText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending GenieACS task:', error);
    throw error;
  }
}

export async function getUnlinkedGenieACSDevices() {
  const prisma = (await import("@/lib/prisma")).default;
  const linkedDevices = await prisma.genieACSDevice.findMany({
    select: { deviceId: true }
  });
  
  const linkedIds = linkedDevices.map(d => d.deviceId);
  
  const allDevices = await getGenieACSDevices({}, ['_id', 'InternetGatewayDevice.DeviceInfo.ProductClass']);
  
  return allDevices.filter(device => !linkedIds.includes(device._id));
}
