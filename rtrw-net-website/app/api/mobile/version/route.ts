import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const version = await db.appVersion.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!version) {
      return NextResponse.json({
        versionCode: 1,
        versionName: "1.0.0",
        downloadUrl: "",
        forceUpdate: false,
        releaseNotes: "Belum ada update tersedia.",
      });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    let absoluteDownloadUrl = version.downloadUrl;
    if (version.downloadUrl && !version.downloadUrl.startsWith("http")) {
      absoluteDownloadUrl = `${protocol}://${host}${version.downloadUrl}`;
    }

    return NextResponse.json({
      versionCode: version.versionCode,
      versionName: version.versionName,
      downloadUrl: absoluteDownloadUrl,
      forceUpdate: version.forceUpdate,
      releaseNotes: version.releaseNotes || "",
    });
  } catch (error) {
    console.log("[MOBILE_API_VERSION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
