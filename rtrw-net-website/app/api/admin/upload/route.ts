import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    let buffer: any = Buffer.from(await file.arrayBuffer());

    // Compress image if it's an image
    if (file.type.startsWith("image/")) {
      try {
        buffer = await sharp(buffer)
          .rotate()
          .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 60, progressive: true })
          .toBuffer();
      } catch (err) {
        console.error("Failed to compress image:", err);
      }
    }

    const timestamp = Date.now();
    const cleanFileName =
      file.name.replace(/[^a-zA-Z0-9.\-]/g, "_").split(".")[0] + ".jpg";
    const uniqueFilename = `${timestamp}-${cleanFileName}`;

    const folderName = "admin-uploads";
    const targetUrl = `${process.env.NEXTCLOUD_URL}/${folderName}/${uniqueFilename}`;

    const uploadRes = await fetch(targetUrl, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXTCLOUD_USER}:${process.env.NEXTCLOUD_APP_PASSWORD}`,
        ).toString("base64")}`,
        "Content-Type": "image/jpeg",
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      console.error("Nextcloud Upload Error:", await uploadRes.text());
      return NextResponse.json(
        { error: "Failed to upload to storage" },
        { status: 500 },
      );
    }

    const fileUrl = `/api/file/${folderName}/${uniqueFilename}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error("[UPLOAD_POST]", error.message);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
