import { Invoice, User } from "@prisma/client";
import { PDFDocument } from "pdf-lib";

// Tipe data ini dibutuhkan oleh generateInvoicePdf
type InvoiceWithFullUser = Invoice & { user: User };

export async function mergePdfBuffers(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length <= 1) return buffers[0];

  const mergedPdf = await PDFDocument.create();
  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
}

// Fungsi-fungsi helper
export function toRoman(num: number): string {
  const roman = {
    M: 1000,
    CM: 900,
    D: 500,
    CD: 400,
    C: 100,
    XC: 90,
    L: 50,
    XL: 40,
    X: 10,
    IX: 9,
    V: 5,
    IV: 4,
    I: 1,
  };
  const romanKeys = Object.keys(roman) as (keyof typeof roman)[];
  let str = "";
  for (let i of romanKeys) {
    let q = Math.floor(num / roman[i]);
    num -= q * roman[i];
    str += i.repeat(q);
  }
  return str;
}

export function getMonthName(monthNum: number): string {
  return new Date(2000, monthNum - 1).toLocaleString("id-ID", {
    month: "long",
  });
}

export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;
  
  // Jika target adalah grup JID (biasanya ID panjang @g.us)
  if (phone.endsWith("@g.us")) return true;

  // Bersihkan karakter non-digit
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Minimal 10 digit (standar HP Indonesia 08xx...)
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export async function sendWhatsAppMessage(target: string, message: string) {
  const waUrl = process.env.WA_GATEWAY_URL; // e.g., http://wa-gateway:3000
  const apiKey = process.env.WA_API_KEY; // e.g., admin:Rahas1aMuly4!

  if (!waUrl || !apiKey) {
    console.error(
      "Gagal: Konfigurasi WA_GATEWAY_URL atau WA_API_KEY tidak ditemukan.",
    );
    return { success: false, error: "Konfigurasi WA Gateway tidak lengkap." };
  }

  if (!isValidPhoneNumber(target)) {
    console.warn(`⚠️ Lewati kirim WA: Nomor tidak valid (${target})`);
    return { success: false, error: "Nomor WhatsApp tidak valid." };
  }

  // 1. Format nomor WA
  let formattedTarget = target;
  
  // Jika bukan JID (tidak mengandung @)
  if (!target.includes("@")) {
    formattedTarget = target.replace(/[^0-9]/g, "");
    if (formattedTarget.startsWith("0")) {
      formattedTarget = "62" + formattedTarget.substring(1);
    }
  }

  // 2. [WAJIB UNTUK GOWA] Tambahkan JID suffix jika belum ada
  if (
    !formattedTarget.endsWith("@s.whatsapp.net") &&
    !formattedTarget.endsWith("@g.us")
  ) {
    formattedTarget = formattedTarget + "@s.whatsapp.net";
  }

  try {
    const basicAuth = Buffer.from(apiKey).toString("base64");

    // 3. [PERBAIKAN] Endpoint GOWA yang benar
    const endpoint = `${waUrl}/send/message`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      // 4. [PERBAIKAN] Field payload standar dokumentasi GOWA
      body: JSON.stringify({
        phone: formattedTarget,
        message: message,
      }),
      cache: "no-store",
    });

    // 5. [SABUK PENGAMAN DevOps] Cek tipe response untuk mencegah error 'Unexpected Token C'
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      throw new Error(
        `Respons Server bukan JSON (Mungkin Endpoint Salah): ${textError.substring(0, 50)}...`,
      );
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `WA Gateway Error: ${result.message || response.statusText}`,
      );
    }

    console.log("✅ Pesan WA terkirim ke:", formattedTarget);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Gagal mengirim pesan WA internal:", error.message);
    return { success: false, error: "Gagal terhubung ke WA Gateway." };
  }
}

export async function sendWhatsAppPresence(target: string, type: "composing" | "available" | "unavailable") {
  const waUrl = process.env.WA_GATEWAY_URL;
  const apiKey = process.env.WA_API_KEY;

  if (!waUrl || !apiKey || !isValidPhoneNumber(target)) return;

  let formattedTarget = target;
  if (!target.includes("@")) {
    formattedTarget = target.replace(/[^0-9]/g, "");
    if (formattedTarget.startsWith("0")) formattedTarget = "62" + formattedTarget.substring(1);
    formattedTarget = formattedTarget + "@s.whatsapp.net";
  }

  try {
    const basicAuth = Buffer.from(apiKey).toString("base64");
    await fetch(`${waUrl}/presence`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: formattedTarget, type }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Presence error:", error);
  }
}

export async function sendWhatsAppDocument(
  target: string,
  pdfBuffer: Buffer | ArrayBuffer,
  fileName: string,
  caption?: string,
) {
  const waUrl = process.env.WA_GATEWAY_URL;
  const apiKey = process.env.WA_API_KEY;

  if (!waUrl || !apiKey) {
    console.error(
      "Gagal: Konfigurasi WA_GATEWAY_URL atau WA_API_KEY tidak ditemukan.",
    );
    return { success: false, error: "Konfigurasi WA Gateway tidak lengkap." };
  }

  if (!isValidPhoneNumber(target)) {
    console.warn(`⚠️ Lewati kirim Dokumen WA: Nomor tidak valid (${target})`);
    return { success: false, error: "Nomor WhatsApp tidak valid." };
  }

  // 1. Format nomor WA
  let formattedTarget = target.replace(/[^0-9]/g, "");
  if (formattedTarget.startsWith("0")) {
    formattedTarget = "62" + formattedTarget.substring(1);
  }

  if (
    !formattedTarget.endsWith("@s.whatsapp.net") &&
    !formattedTarget.endsWith("@g.us")
  ) {
    formattedTarget = formattedTarget + "@s.whatsapp.net";
  }

  try {
    const basicAuth = Buffer.from(apiKey).toString("base64");
    const endpoint = `${waUrl}/send/file`;

    const formData = new FormData();
    formData.append("phone", formattedTarget);

    // GOWA Document Message expects 'document' field as a file
    const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], {
      type: "application/pdf",
    });
    formData.append("file", pdfBlob, fileName);

    if (caption) {
      formData.append("caption", caption);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
      body: formData,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const textError = await response.text();
      throw new Error(
        `Respons Server bukan JSON: ${textError.substring(0, 50)}...`,
      );
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `WA Gateway Error: ${result.message || response.statusText}`,
      );
    }

    console.log("✅ Dokumen WA terkirim ke:", formattedTarget);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Gagal mengirim dokumen WA internal:", error.message);
    return { success: false, error: "Gagal terhubung ke WA Gateway." };
  }
}

import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export async function generateInvoicePdf(
  invoice: InvoiceWithFullUser,
): Promise<{ pdfUrl: string; pdfBuffer: Buffer; fileName: string }> {
  const periodeBulan = getMonthName(invoice.month);

  // 1. Siapkan data yang akan diinject ke template
  const dataTagihan = {
    nomerInvoice: `TEJA/${(invoice.user.idNumber || '').replace('JINDE', '')}/${toRoman(invoice.month)}/${invoice.year}`,
    nama: invoice.user.name,
    alamat: invoice.user.address || "-",
    idpelanggan: invoice.user.idNumber,
    periode: `${periodeBulan} ${invoice.year}`,
    total: (invoice.user.abonemen - invoice.user.potongan).toLocaleString(
      "id-ID",
    ),
    abonemen: invoice.user.abonemen.toLocaleString("id-ID"),
    potongan: invoice.user.potongan.toLocaleString("id-ID"),
    tanggallunas: new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
  };

  try {
    // 2. Baca template DOCX
    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "nota.docx",
    );
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template DOCX tidak ditemukan di path: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 3. Inject data ke DOCX
    doc.render(dataTagihan);
    const generatedDocxBuffer = doc.getZip().generate({ type: "nodebuffer" });

    // 4. Konversi DOCX ke PDF via Gotenberg
    const gotenbergUrl = process.env.GOTENBERG_URL || "http://localhost:3000";
    const formData = new FormData();
    const docxBlob = new Blob([new Uint8Array(generatedDocxBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    formData.append("files", docxBlob, "nota.docx");

    // Filter parameter untuk memaksa render PDF mentok di 1 halaman
    formData.append("nativePageRanges", "1-1");

    const convertUrl = `${gotenbergUrl}/forms/libreoffice/convert`;
    const convertResponse = await fetch(convertUrl, {
      method: "POST",
      body: formData,
    });

    if (!convertResponse.ok) {
      throw new Error(
        `Gotenberg Error: Gagal mengkonversi ke PDF. Status: ${convertResponse.status} ${convertResponse.statusText}`,
      );
    }

    const pdfArrayBuffer = await convertResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // 5. Upload PDF ke Nextcloud WebDAV
    const nextcloudUrl = process.env.NEXTCLOUD_URL;
    const nextcloudUser = process.env.NEXTCLOUD_USER;
    const nextcloudPass = process.env.NEXTCLOUD_APP_PASSWORD;

    if (!nextcloudUrl || !nextcloudUser || !nextcloudPass) {
      throw new Error(
        "Kredensial Nextcloud tidak lengkap di konfigurasi (.env)",
      );
    }

    // Ekstrak base API Host
    const ncUrlObj = new URL(nextcloudUrl);
    const nextcloudBase = `${ncUrlObj.protocol}//${ncUrlObj.host}`;

    // Nama file unik di Nextcloud
    const safeName = invoice.user.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const fileName = `INV-${safeName}-${invoice.month}-${invoice.year}.pdf`;

    // Pastikan nextcloudUrl diakhiri dengan / jika belum, lalu tambahkan subdirectory /nota/
    const baseUrl = nextcloudUrl.endsWith("/")
      ? nextcloudUrl.slice(0, -1)
      : nextcloudUrl;
    const targetUploadUrl = `${baseUrl}/nota/${fileName}`;

    const basicAuth = Buffer.from(`${nextcloudUser}:${nextcloudPass}`).toString(
      "base64",
    );

    const uploadResponse = await fetch(targetUploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/pdf",
      },
      body: pdfBuffer,
    });

    if (
      !uploadResponse.ok &&
      uploadResponse.status !== 201 &&
      uploadResponse.status !== 204
    ) {
      throw new Error(
        `Gagal upload ke Nextcloud di folder nota: ${uploadResponse.status} ${uploadResponse.statusText}. Pastikan folder /nota sudah dibuat di Nextcloud.`,
      );
    }

    // 6. Dapatkan Share Link Public via Nextcloud OCS API
    const shareApiUrl = `${nextcloudBase}/ocs/v1.php/apps/files_sharing/api/v1/shares`;

    // Endpoint NEXTCLOUD_URL mengandung path DAV. Kita harus memisahkannya untuk OCS API `path` param
    // NEXTCLOUD_URL = http://host/remote.php/dav/files/user/App-Billing
    // Path yg dibutuhkan Nextcloud Share API format format = /App-Billing/nota/filename.pdf
    const matchPath = baseUrl.match(/\/files\/[^/]+(.*)/);
    const basePath = matchPath ? matchPath[1] : "";
    const ncSharePath = `${basePath}/nota/${fileName}`;

    const shareFormData = new URLSearchParams();
    shareFormData.append("path", ncSharePath);
    shareFormData.append("shareType", "3"); // 3 = public link
    shareFormData.append("publicUpload", "false");

    const shareResponse = await fetch(shareApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "OCS-APIRequest": "true",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: shareFormData,
    });

    let shareLink = "";

    if (shareResponse.ok) {
      const shareData = await shareResponse.json();
      // OCS return object: { ocs: { data: { url: "http://..." } } }
      shareLink = shareData?.ocs?.data?.url;
    } else {
      // Coba Cek Jika File Sudah Punya Share Link Sebelumnya (karena duplikasi)
      const getSharesResponse = await fetch(
        `${shareApiUrl}?path=${encodeURIComponent(ncSharePath)}&format=json`,
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "OCS-APIRequest": "true",
            Accept: "application/json",
          },
        },
      );
      if (getSharesResponse.ok) {
        const getSharesData = await getSharesResponse.json();
        const shares = getSharesData?.ocs?.data;
        if (Array.isArray(shares) && shares.length > 0) {
          const publicShare = shares.find((s: any) => s.share_type === 3);
          if (publicShare) {
            shareLink = publicShare.url;
          }
        }
      }
    }

    if (!shareLink) {
      throw new Error("Gagal generate Share Link dari Nextcloud.");
    }

    // Jika kita ingin supaya linknya mengarah ke direct download, tambahkan /download di akhir
    // Nextcloud versi baru otomatis menyediakan endpoint download dengan appending /download ke share link.
    const directDownloadLink = shareLink.endsWith("/download")
      ? shareLink
      : `${shareLink}/download`;

    return { pdfUrl: directDownloadLink, pdfBuffer, fileName };
  } catch (error: any) {
    console.error("Error generating invoice PDF:", error);
    throw new Error(`Gagal membuat PDF: ${error.message}`);
  }
}
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
