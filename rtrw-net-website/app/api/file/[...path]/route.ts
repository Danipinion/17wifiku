import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } },
) {
  // 1. Tangkap nama file atau folder dari URL
  const { path } = await params;
  const filePath = path.join("/");

  // 2. Gabungkan dengan URL dasar Nextcloud WebDAV dari .env
  const targetUrl = `${process.env.NEXTCLOUD_URL}/${filePath}`;

  try {
    // 3. Request ke Nextcloud Lokal menggunakan App Password
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.NEXTCLOUD_USER}:${process.env.NEXTCLOUD_APP_PASSWORD}`,
        ).toString("base64")}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return new NextResponse("File tidak ditemukan di Storage", {
          status: 404,
        });
      }
      return new NextResponse(`Error dari storage: ${response.statusText}`, {
        status: response.status,
      });
    }

    // 4. Ambil tipe file (misal: image/jpeg, application/vnd.android.package-archive)
    const contentType =
      response.headers.get("content-type") || "application/octet-stream";

    // 5. Stream file langsung ke browser pelanggan (Tanpa disimpan di RAM Next.js)
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        // Optimasi: Minta browser pelanggan menyimpan gambar ini selama 1 hari agar server tidak capek
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    console.error("Nextcloud Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
