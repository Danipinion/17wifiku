import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAnyAuthSession } from "@/lib/api-auth";

/**
 * API Proxy untuk mendownload PDF untuk Pelanggan.
 * GET: /api/mobile/my-invoices/[invoiceId]/download
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  // 1. Validasi Sesi Pelanggan
  const { session, error } = await getAnyAuthSession(request);
  if (error) return error;

  try {
    const { invoiceId } = params;

    // 2. Ambil data invoice dan PASTI kan milik user yang login
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { pdfUrl: true, userId: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }

    if (invoice.userId !== session.id) {
       return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    if (!invoice.pdfUrl) {
      return NextResponse.json(
        { error: "Nota belum tersedia untuk tagihan ini" },
        { status: 404 }
      );
    }

    // 3. Ambil kredensial Nextcloud
    const nextcloudUser = process.env.NEXTCLOUD_USER;
    const nextcloudPass = process.env.NEXTCLOUD_APP_PASSWORD;

    if (!nextcloudUser || !nextcloudPass) {
       return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const basicAuth = Buffer.from(`${nextcloudUser}:${nextcloudPass}`).toString('base64');

    // 4. Fetch dari Nextcloud (Server-side)
    const response = await fetch(invoice.pdfUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
      },
    });

    if (!response.ok) {
       return NextResponse.json({ error: "Gagal mengambil file nota" }, { status: 502 });
    }

    const pdfBuffer = await response.arrayBuffer();
    
    // 5. Kembalikan stream PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nota-${invoiceId}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error("Error Customer Proxy Download PDF:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
