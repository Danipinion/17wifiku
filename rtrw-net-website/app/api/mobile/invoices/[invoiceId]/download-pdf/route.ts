import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";

/**
 * API Proxy untuk mendownload PDF dari Nextcloud IP Private melalui Tunneling Web.
 * GET: /api/mobile/invoices/[invoiceId]/download-pdf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  // 1. Validasi Sesi (Keamanan)
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const { invoiceId } = params;

    // 2. Ambil data invoice untuk mendapatkan pdfUrl
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { pdfUrl: true, status: true }
    });

    if (!invoice || !invoice.pdfUrl) {
      return NextResponse.json(
        { error: "Nota tidak ditemukan atau belum digenerate" },
        { status: 404 }
      );
    }

    // 3. Ambil kredensial Nextcloud dari .env
    const nextcloudUser = process.env.NEXTCLOUD_USER;
    const nextcloudPass = process.env.NEXTCLOUD_APP_PASSWORD;

    if (!nextcloudUser || !nextcloudPass) {
       return NextResponse.json(
         { error: "Konfigurasi server tidak lengkap" },
         { status: 500 }
       );
    }

    const basicAuth = Buffer.from(`${nextcloudUser}:${nextcloudPass}`).toString('base64');

    // 4. Fetch file dari Nextcloud (Server Side Request)
    // Karena ini dijalankan di server Next.js (yang satu jaringan/tunnel dengan Nextcloud),
    // maka ia bisa mengakses IP Private/URL Nextcloud lokal.
    const response = await fetch(invoice.pdfUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Gagal mengambil file dari Nextcloud: ${response.statusText}` },
        { status: response.status }
      );
    }

    // 5. Stream kembali file PDF ke Android
    const pdfBuffer = await response.arrayBuffer();
    
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nota-${invoiceId}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("Error Proxy Download PDF:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
