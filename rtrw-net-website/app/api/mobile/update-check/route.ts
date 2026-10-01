import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const latest = await prisma.appVersion.findFirst({
      where: { appType: "CUSTOMER" },
      orderBy: { versionCode: "desc" },
    });

    if (!latest) {
      return NextResponse.json({
        latestVersion: "1.0",
        latestVersionCode: 1,
        url: "",
        releaseNotes: ["Versi awal"]
      });
    }

    const host = request.headers.get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    
    const downloadUrl = latest.downloadUrl.startsWith("http") 
      ? latest.downloadUrl 
      : `${baseUrl}${latest.downloadUrl}`;

    return NextResponse.json({
      latestVersion: latest.versionName,
      latestVersionCode: latest.versionCode,
      url: downloadUrl,
      releaseNotes: latest.releaseNotes ? latest.releaseNotes.split("\n") : []
    });
  } catch (err) {
    return NextResponse.json({ error: "Gagal cek versi" }, { status: 500 });
  }
}
