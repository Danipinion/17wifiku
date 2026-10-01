import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

type ApiErrorResponse = {
  status: "error";
  message: string;
};

export async function POST(
  request: Request
): Promise<NextResponse<ApiErrorResponse | Blob>> {
  try {
    const body = await request.json();
    const urls = body.urls as string[];

    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error("Array 'urls' tidak valid atau tidak ditemukan.");
    }

    const mergedPdf = await PDFDocument.create();

    for (const url of urls) {
      if (!url || typeof url !== "string") {
        console.warn(`Melewatkan URL tidak valid: ${url}`);
        continue;
      }

      // Fetch the PDF directly via the public URL (Nextcloud/Other)
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(
          `Gagal download PDF (${url}): ${response.statusText}`
        );
      }

      const fileBuffer = await response.arrayBuffer();

      const pdfDoc = await PDFDocument.load(fileBuffer);

      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices()
      );
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();

    const pdfBuffer = Buffer.from(mergedPdfBytes);

    // 2. Pass the Buffer directly to NextResponse
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="merged.pdf"',
      },
    });
  } catch (error: unknown) {
    let errorMessage = "Terjadi kesalahan tidak diketahui di server.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error in /api/print-pdf:", errorMessage, error);

    return NextResponse.json(
      { status: "error", message: errorMessage },
      { status: 500 }
    );
  }
}
