"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNetworkData() {
  const olts = await prisma.oLT.findMany({
    include: {
      odcs: true,
      odps: true,
      converters: true,
    }
  });

  const odcs = await prisma.oDC.findMany({
    include: {
      converters: {
        include: {
          users: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
              status: true,
              role: true,
              odpId: true,
              converterId: true,
              abonemen: true,
              potongan: true,
            },
          },
          odps: {
            include: {
              users: {
                select: {
                  id: true,
                  name: true,
                  latitude: true,
                  longitude: true,
                  status: true,
                  role: true,
                  odpId: true,
                  converterId: true,
                  abonemen: true,
                  potongan: true,
                },
              },
            },
          },
        },
      },
      odps: {
        where: { converterId: null },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              latitude: true,
              longitude: true,
              status: true,
              role: true,
              odpId: true,
              converterId: true,
              abonemen: true,
              potongan: true,
            },
          },
        },
      },
    },
  });

  // Fetch all ODPs flat to handle cascading links easily
  const allODPs = await prisma.oDP.findMany({
    include: {
      users: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          status: true,
          role: true,
          odpId: true,
          converterId: true,
          abonemen: true,
        }
      }
    }
  });

  // Also fetch users without ODP but have coordinates
  const standaloneUsers = await prisma.user.findMany({
    where: {
      role: "PELANGGAN",
      odpId: null,
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      status: true,
      role: true,
      odpId: true,
      converterId: true,
      abonemen: true,
      potongan: true,
    },
  });

  return { olts, odcs, standaloneUsers, allODPs };
}

export async function updateNodeLocation(
  type: "OLT" | "ODC" | "Converter" | "ODP",
  id: string,
  lat: number,
  lng: number
) {
  try {
    if (type === "OLT") {
      await prisma.oLT.update({
        where: { id },
        data: { latitude: lat, longitude: lng },
      });
    } else if (type === "ODC") {
      await prisma.oDC.update({
        where: { id },
        data: { latitude: lat, longitude: lng },
      });
    } else if (type === "Converter") {
      await prisma.converter.update({
        where: { id },
        data: { latitude: lat, longitude: lng },
      });
    } else if (type === "ODP") {
      await prisma.oDP.update({
        where: { id },
        data: { latitude: lat, longitude: lng },
      });
    }
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    console.error("Failed to update node location:", error);
    return { success: false, error: "Gagal update lokasi" };
  }
}

export async function updateCustomerLocation(
  id: string,
  lat: number,
  lng: number
) {
  try {
    await prisma.user.update({
      where: { id },
      data: { latitude: lat, longitude: lng },
    });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    console.error("Failed to update customer location:", error);
    return { success: false, error: "Gagal update lokasi pelanggan" };
  }
}

export async function createOLT(data: { name: string; lat?: number; lng?: number }) {
  try {
    const olt = await prisma.oLT.create({
      data: {
        name: data.name,
        latitude: data.lat,
        longitude: data.lng,
      },
    });
    revalidatePath("/admin/network-map");
    return { success: true, data: olt };
  } catch (error) {
    return { success: false, error: "Gagal membuat OLT" };
  }
}

export async function createODC(data: { 
  name: string; 
  lat?: number; 
  lng?: number;
  oltId?: string;
  parentOdcId?: string;
  parentOdpId?: string;
}) {
  try {
    const odc = await prisma.oDC.create({
      data: {
        name: data.name,
        latitude: data.lat,
        longitude: data.lng,
        oltId: data.oltId,
        parentOdcId: data.parentOdcId,
        parentOdpId: data.parentOdpId,
      },
    });
    revalidatePath("/admin/network-map");
    return { success: true, data: odc };
  } catch (error) {
    return { success: false, error: "Gagal membuat ODC" };
  }
}

export async function createConverter(data: { 
  name: string; 
  odcId?: string; 
  oltId?: string;
  lat?: number; 
  lng?: number 
}) {
  try {
    const converter = await prisma.converter.create({
      data: {
        name: data.name,
        odcId: data.odcId,
        oltId: data.oltId,
        latitude: data.lat,
        longitude: data.lng,
      },
    });
    revalidatePath("/admin/network-map");
    return { success: true, data: converter };
  } catch (error) {
    return { success: false, error: "Gagal membuat Converter" };
  }
}

export async function createODP(data: { 
  name: string; 
  odcId?: string; 
  converterId?: string; 
  parentOdpId?: string;
  oltId?: string;
  lat?: number; 
  lng?: number;
  capacity?: number;
}) {
  try {
    const odp = await prisma.oDP.create({
      data: {
        name: data.name,
        odcId: data.odcId,
        converterId: data.converterId,
        parentOdpId: data.parentOdpId,
        oltId: data.oltId,
        latitude: data.lat,
        longitude: data.lng,
        capacity: data.capacity || 8,
      },
    });
    revalidatePath("/admin/network-map");
    return { success: true, data: odp };
  } catch (error) {
    return { success: false, error: "Gagal membuat ODP" };
  }
}

export async function assignUserToODP(userId: string, odpId: string | null) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { odpId, converterId: null }, // Assigning to ODP means it's not directly in a converter
    });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menetapkan ODP ke pelanggan" };
  }
}

export async function assignUserToConverter(userId: string, converterId: string | null) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { converterId, odpId: null }, // Assigning to Converter means it's not in an ODP
    });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menetapkan Converter ke pelanggan" };
  }
}

export async function assignODPToParentODP(
  odpId: string,
  type: "OLT" | "ODC" | "CONV" | "ODP",
  targetId: string | null
) {
  try {
    await prisma.oDP.update({
      where: { id: odpId },
      data: {
        oltId: type === "OLT" ? targetId : null,
        odcId: type === "ODC" ? targetId : null,
        converterId: type === "CONV" ? targetId : null,
        parentOdpId: type === "ODP" ? targetId : null,
      },
    });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghubungkan ODP" };
  }
}
export async function assignODCConnection(odcId: string, type: "OLT" | "ODC" | "ODP", targetId: string | null) {
  try {
    await prisma.oDC.update({
      where: { id: odcId },
      data: {
        oltId: type === "OLT" ? targetId : null,
        parentOdcId: type === "ODC" ? targetId : null,
        parentOdpId: type === "ODP" ? targetId : null,
      },
    });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghubungkan ODC" };
  }
}

export async function deleteOLT(id: string) {
  try {
    await prisma.oLT.delete({ where: { id } });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal hapus OLT. Pastikan tidak ada ODC/ODP yang terhubung." };
  }
}

export async function deleteODC(id: string) {
  try {
    await prisma.oDC.delete({ where: { id } });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal hapus ODC. Pastikan tidak ada ODP/Converter yang terhubung." };
  }
}

export async function deleteConverter(id: string) {
  try {
    await prisma.converter.delete({ where: { id } });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal hapus Converter. Pastikan tidak ada ODP terhubung." };
  }
}

export async function deleteODP(id: string) {
  try {
    await prisma.oDP.delete({ where: { id } });
    revalidatePath("/admin/network-map");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal hapus ODP. Pastikan tidak ada pelanggan terhubung." };
  }
}
