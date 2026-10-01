import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const appType = searchParams.get("appType") || "CUSTOMER";

    const version = await db.appVersion.findFirst({
      where: { appType },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(version || {});
  } catch (error) {
    console.log("[APP_VERSION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const versionCodeStr = formData.get("versionCode") as string;
    const versionName = formData.get("versionName") as string;
    const forceUpdateStr = formData.get("forceUpdate") as string;
    const releaseNotes = formData.get("releaseNotes") as string;
    const appType = (formData.get("appType") as string) || "CUSTOMER";
    const apkFile = formData.get("apkFile") as File | null;

    if (!versionCodeStr || !versionName) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const versionCode = parseInt(versionCodeStr);
    const forceUpdate = forceUpdateStr === "true";

    let downloadUrl = "";

    if (apkFile && apkFile.size > 0) {
      const bytes = await apkFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const prefix = appType === "CUSTOMER" ? "sobat-wiff" : "lapor-pak";
      const fileName = `${prefix}-v${versionName}-${Date.now()}.apk`;
      const folderName = "apk";
      const targetUrl = `${process.env.NEXTCLOUD_URL}/${folderName}/${fileName}`;

      // Upload ke Nextcloud
      const uploadRes = await fetch(targetUrl, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.NEXTCLOUD_USER}:${process.env.NEXTCLOUD_APP_PASSWORD}`,
          ).toString("base64")}`,
          "Content-Type": "application/vnd.android.package-archive",
        },
        body: buffer,
      });

      if (!uploadRes.ok) {
        console.error("Nextcloud APK Upload Error:", await uploadRes.text());
        return new NextResponse("Gagal mengunggah APK ke cloud storage", {
          status: 500,
        });
      }

      downloadUrl = `/api/file/${folderName}/${fileName}`;
    }

    // if no new apk, keep old one
    if (!downloadUrl) {
      const latest = await db.appVersion.findFirst({
        where: { appType },
        orderBy: { createdAt: "desc" },
      });
      if (latest) {
        downloadUrl = latest.downloadUrl;
      } else {
        return new NextResponse("APK file is required for the first version", {
          status: 400,
        });
      }
    }

    const newVersion = await db.appVersion.create({
      data: {
        versionCode,
        versionName,
        appType,
        forceUpdate,
        releaseNotes,
        downloadUrl,
      },
    });

    return NextResponse.json(newVersion);
  } catch (error) {
    console.log("[APP_VERSION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
