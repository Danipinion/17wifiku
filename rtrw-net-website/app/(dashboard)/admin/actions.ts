"use server";

import { signOut } from "@/lib/auth";
import {
  generateInvoicePdf,
  getMonthName,
  sendWhatsAppMessage,
  sendWhatsAppPresence,
  sendWhatsAppDocument,
  mergePdfBuffers,
  sleep,
  randomInt,
  formatRupiah,
} from "@/lib/billingHelpers";
import prisma from "@/lib/prisma";
// [WAJIB] Import Emitter
import {
  notificationEmitter,
  NOTIFICATION_EVENT,
} from "@/lib/notificationStream";
import {
  ComplaintStatus,
  Invoice,
  InvoiceStatus,
  Role,
  User,
  UserStatus,
} from "@prisma/client";
import { hash } from "bcrypt-ts";
import { revalidatePath } from "next/cache";
import * as xlsx from "xlsx";

// --- Helper Lokal ---
async function generateNextIdNumber() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `JINDE${year}${month}`;

  const lastPelanggan = await prisma.user.findFirst({
    where: { idNumber: { startsWith: prefix } },
    orderBy: { idNumber: "desc" },
  });

  if (lastPelanggan && lastPelanggan.idNumber) {
    const lastSequence = parseInt(lastPelanggan.idNumber.replace(prefix, ""));
    const newSequence = lastSequence + 1;
    return `${prefix}${String(newSequence).padStart(4, "0")}`;
  }
  return `${prefix}0001`;
}

function getCurrentTimeWIB() {
  return new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
// --------------------

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

export async function createPelanggan(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const abonemenStr = formData.get("abonemen") as string;
  const potonganStr = formData.get("potongan") as string;
  const defaultPassword = "user1111";

  if (!name || !phone) {
    return { error: "Nama dan Nomor HP wajib diisi." };
  }

  const abonemen = parseFloat(abonemenStr);
  const potongan = potonganStr ? parseFloat(potonganStr) : 0;

  if (isNaN(abonemen) || isNaN(potongan)) {
    return { error: "Tagihan dan diskon harus berupa angka." };
  }

  try {
    const newIdNumber = await generateNextIdNumber();
    const hashedPassword = await hash(defaultPassword, 10);

    await prisma.user.create({
      data: {
        name,
        phone,
        address,
        password: hashedPassword,
        role: "PELANGGAN",
        idNumber: newIdNumber,
        abonemen,
        potongan,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      },
    });

    revalidatePath("/admin/pelanggan");
    return {
      success: `Pelanggan berhasil ditambahkan dengan ID: ${newIdNumber}`,
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      const target = error.meta?.target as string[];
      if (target?.includes("phone"))
        return { error: "Nomor HP sudah terdaftar." };
      if (target?.includes("idNumber"))
        return { error: "Terjadi duplikasi ID Pelanggan, silakan coba lagi." };
    }
    console.error(error);
    return { error: "Gagal menambahkan pelanggan." };
  }
}

export async function importPelangganFromExcel(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { error: "File tidak ditemukan atau kosong." };
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet) as { [key: string]: string }[];

    if (data.length === 0) {
      return { error: "File Excel tidak berisi data." };
    }

    const pelangganToCreate = [];
    const defaultPassword = "user1111";
    const hashedPassword = await hash(defaultPassword, 10);

    for (const row of data) {
      if (!row["nama"] || !row["nomer hp"] || !row["abonemen"]) {
        continue;
      }

      let idNumber = row["idNumber"]
        ? String(row["idNumber"])
        : await generateNextIdNumber();

      pelangganToCreate.push({
        idNumber: idNumber,
        name: String(row["nama"]),
        phone: String(row["nomer hp"]),
        address: row["alamat"] ? String(row["alamat"]) : "",
        abonemen: parseFloat(row["abonemen"]),
        potongan: row["potongan"] ? parseFloat(row["potongan"]) : 0,
        password: hashedPassword,
        role: Role.PELANGGAN,
        status: UserStatus.ACTIVE,
        referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
    }

    const result = await prisma.user.createMany({
      data: pelangganToCreate,
      skipDuplicates: true,
    });

    revalidatePath("/admin/pelanggan");
    return { success: `${result.count} pelanggan berhasil diimpor.` };
  } catch (error: any) {
    console.error("Gagal import Excel:", error);
    return { error: `Gagal memproses file: ${error.message}` };
  }
}

export async function updatePelanggan(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const abonemenStr = formData.get("abonemen") as string;
  const potonganStr = formData.get("potongan") as string;

  if (!id || !name || !phone || !abonemenStr) {
    return { error: "Data wajib tidak boleh kosong." };
  }

  const abonemen = parseFloat(abonemenStr);
  const potongan = potonganStr ? parseFloat(potonganStr) : 0;

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        phone,
        address,
        abonemen,
        potongan,
      },
    });
    revalidatePath("/admin/pelanggan");
    return { success: "Data pelanggan berhasil diperbarui." };
  } catch (error: any) {
    return { error: "Gagal memperbarui data pelanggan." };
  }
}

export async function resetPasswordAdmin(userId: string) {
  const defaultPassword = "user1111";
  try {
    const hashedPassword = await hash(defaultPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return {
      success: `Password pelanggan berhasil direset ke "${defaultPassword}".`,
    };
  } catch (error) {
    return { error: "Gagal mereset password pelanggan." };
  }
}

export async function updateUserStatus(userId: string, newStatus: UserStatus) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });
    revalidatePath("/admin/pelanggan");
    return { success: "Status pelanggan berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui status pelanggan." };
  }
}

export async function generateInvoicesForMonth(formData: FormData) {
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);

  if (!month || !year) return { error: "Bulan dan tahun harus dipilih." };

  try {
    const allPelanggan = await prisma.user.findMany({
      where: { role: "PELANGGAN", status: "ACTIVE" },
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const pelanggan of allPelanggan) {
      const existingInvoice = await prisma.invoice.findFirst({
        where: { userId: pelanggan.id, month, year },
      });

      if (!existingInvoice) {
        // [REF-DISCOUNT] Calculate referral discount
        // Logic: For each approved referral whose invoice in the PREVIOUS month is PAID, subtract 5k.
        let referralDiscount = 0;
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        const referrals = await prisma.referral.findMany({
          where: {
            referrerId: pelanggan.id,
            status: "APPROVED",
          },
          include: {
            referee: {
              include: {
                invoices: {
                  where: { month: prevMonth, year: prevYear, status: "PAID" },
                },
              },
            },
          },
        });

        referralDiscount =
          referrals.filter((r) => r.referee.invoices.length > 0).length * 10000;

        const finalAmount =
          pelanggan.abonemen - pelanggan.potongan - referralDiscount;
        await prisma.invoice.create({
          data: {
            userId: pelanggan.id,
            month,
            year,
            amount: finalAmount < 0 ? 0 : finalAmount,
            status: "UNPAID",
          },
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }
    revalidatePath("/admin/tagihan");
    return {
      success: `${createdCount} tagihan baru berhasil dibuat. ${skippedCount} dilewati.`,
    };
  } catch (error) {
    return { error: "Gagal membuat tagihan massal." };
  }
}

const INVOICES_PER_PAGE = 10;

export async function fetchInvoices({
  query,
  status,
  month,
  year,
  page = 1,
}: {
  query?: string;
  status?: InvoiceStatus;
  month?: number;
  year?: number;
  page?: number;
}) {
  const whereClause: any = {};

  if (query) {
    whereClause.user = {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    };
  }
  if (status) whereClause.status = status;
  if (month) whereClause.month = month;
  if (year) whereClause.year = year;

  try {
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: INVOICES_PER_PAGE,
      skip: (page - 1) * INVOICES_PER_PAGE,
    });

    const summary = await prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: whereClause,
    });

    const totalFilteredInvoices = summary._count.id;
    const hasMore = page * INVOICES_PER_PAGE < totalFilteredInvoices;

    return {
      invoices,
      hasMore,
      summary: {
        totalCount: totalFilteredInvoices,
        totalAmount: summary._sum.amount || 0,
      },
    };
  } catch (error) {
    return {
      invoices: [],
      hasMore: false,
      summary: { totalCount: 0, totalAmount: 0 },
      error: "Gagal mengambil data tagihan.",
    };
  }
}

// --- SINGLE PAYMENT ACTION ---
export async function updateInvoiceStatus(
  invoiceId: string,
  newStatus: "PAID" | "UNPAID",
) {
  if (newStatus === "UNPAID") {
    try {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "UNPAID", paidAt: null, pdfUrl: null },
      });
      revalidatePath("/admin/tagihan");
      return { success: "Status tagihan berhasil dibatalkan." };
    } catch (error) {
      return { error: "Gagal membatalkan status tagihan." };
    }
  }

  if (newStatus === "PAID") {
    try {
      const invoice = await prisma.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { user: true },
      });

      if (invoice.status === "PAID" && invoice.pdfUrl) {
        return {
          message: "Tagihan ini sudah lunas.",
          pdfUrl: invoice.pdfUrl,
        };
      }

      const { pdfUrl, pdfBuffer, fileName } = await generateInvoicePdf(invoice);

      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: new Date(),
          pdfUrl: pdfUrl,
        },
        include: { user: true },
      });

      // 1. Kirim WA
      const message = `*TERIMA KASIH ATAS PEMBAYARAN ANDA*\n
      Yth. Bapak / Ibu
      *${updatedInvoice.user.name}*
      ${updatedInvoice.user.phone}
      
      *PEMBAYARAN*
      Tanggal Bayar : ${
        updatedInvoice.paidAt?.toLocaleString("id-ID", {
          dateStyle: "long",
          timeStyle: "short",
        }) ?? "-"
      }

      Tagihan Bulan:
      - ${getMonthName(updatedInvoice.month)} ${updatedInvoice.year}
      Harga Paket : Rp ${updatedInvoice.user.abonemen.toLocaleString("id-ID")}
      
      Total Bayar : *Rp ${updatedInvoice.amount.toLocaleString("id-ID")}*
      Ket : *LUNAS*

      _Nota digital telah dilampirkan dalam pesan ini._`;

      await sendWhatsAppDocument(
        updatedInvoice.user.phone,
        pdfBuffer,
        fileName,
        message,
      );

      // 2. [UPDATE] Kirim Push Notification (Format Konsisten dengan API)
      const jamBayar = getCurrentTimeWIB();
      notificationEmitter.emit(NOTIFICATION_EVENT, {
        title: "Pembayaran Diterima",
        message: `${updatedInvoice.user.name}\nTagihan: ${getMonthName(
          updatedInvoice.month,
        )} ${
          updatedInvoice.year
        }\nJam: ${jamBayar}\nTotal: Rp ${updatedInvoice.amount.toLocaleString(
          "id-ID",
        )}`,
        type: "PAYMENT_SUCCESS",
        invoiceId: updatedInvoice.id,
      });

      // [BARU] Simpan notifikasi ke database untuk pelanggan
      await prisma.notification.create({
        data: {
          userId: invoice.userId,
          title: "Pembayaran Berhasil",
          content: `Terima kasih! Pembayaran tagihan periode ${getMonthName(
            updatedInvoice.month,
          )} ${
            updatedInvoice.year
          } sebesar Rp ${updatedInvoice.amount.toLocaleString(
            "id-ID",
          )} telah kami terima. Semoga Anda menikmati layanan kami dengan senang hati.`,
          type: "BILLING",
          metadata: JSON.stringify({ invoiceId: updatedInvoice.id }),
        },
      });

      // --- PUSH NOTIFICATION (Gotify) ---
      try {
        const { sendBillingSuccess } = await import("@/lib/gotify");
        await sendBillingSuccess(
          invoice.userId, 
          "Pembayaran Berhasil", 
          `Terima kasih! Tagihan ${updatedInvoice.year}/${updatedInvoice.month} sebesar Rp ${updatedInvoice.amount.toLocaleString("id-ID")} telah lunas.`
        );
      } catch (err) {
        console.error("Gotify failed for billing notification:", err);
      }
      // ----------------------------------

      revalidatePath("/admin/tagihan");
      revalidatePath(`/admin/pelanggan/${invoice.userId}`);

      return {
        success: "Tagihan berhasil ditandai lunas dan nota dibuat.",
        pdfUrl: updatedInvoice.pdfUrl || "",
      };
    } catch (error: any) {
      console.error("Gagal menandai lunas:", error);
      return { error: `Terjadi kesalahan: ${error.message}` };
    }
  }
}

// --- BULK PAYMENT ACTION ---
export async function bulkUpdateInvoiceStatus(invoiceIds: string[]) {
  if (!invoiceIds || invoiceIds.length === 0) {
    return { error: "Tidak ada tagihan yang dipilih." };
  }

  try {
    const invoicesToUpdate = await prisma.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        status: "UNPAID",
      },
      include: { user: true },
    });

    if (invoicesToUpdate.length === 0) {
      return {
        message: "Tidak ada tagihan yang diperbarui (mungkin sudah lunas).",
      };
    }

    const updatePromises = invoicesToUpdate.map(async (invoice) => {
      try {
        const { pdfUrl, pdfBuffer, fileName } =
          await generateInvoicePdf(invoice);
        const updatedInvoice = await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            status: "PAID",
            paidAt: new Date(),
            pdfUrl: pdfUrl,
          },
          include: { user: true },
        });

        // [BARU] Simpan notifikasi ke database untuk pelanggan
        await prisma.notification.create({
          data: {
            userId: invoice.userId,
            title: "Pembayaran Berhasil",
            content: `Terima kasih! Pembayaran tagihan periode ${getMonthName(
              updatedInvoice.month,
            )} ${
              updatedInvoice.year
            } sebesar Rp ${updatedInvoice.amount.toLocaleString(
              "id-ID",
            )} telah kami terima. Semoga Anda menikmati layanan kami dengan senang hati.`,
            type: "BILLING",
            metadata: JSON.stringify({ invoiceId: updatedInvoice.id }),
          },
        });

        return {
          status: "success",
          invoice: updatedInvoice,
          pdfBuffer,
          fileName,
        };
      } catch (error: any) {
        return { status: "error", invoice: invoice, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);

    const successfulInvoicesWithMeta: {
      invoice: Invoice & { user: User };
      pdfBuffer: Buffer;
      fileName: string;
    }[] = [];
    const failedInvoiceMessages: string[] = [];
    const successfulPdfUrls: string[] = [];

    for (const res of results) {
      const result = res as any;
      if (result.status === "success") {
        successfulInvoicesWithMeta.push({
          invoice: result.invoice,
          pdfBuffer: result.pdfBuffer,
          fileName: result.fileName,
        });
        if (result.invoice.pdfUrl)
          successfulPdfUrls.push(result.invoice.pdfUrl);
      } else {
        failedInvoiceMessages.push(
          `ID: ${result.invoice.id} (${result.invoice.user.name})`,
        );
      }
    }

    const successfulInvoices = successfulInvoicesWithMeta.map((s) => s.invoice);

    // --- [UPDATE] Kirim Push Notification (Logic Cerdas Single/Bulk) ---
    if (successfulInvoices.length > 0) {
      const totalAmount = successfulInvoices.reduce(
        (sum, inv) => sum + inv.amount,
        0,
      );
      const jamBayar = getCurrentTimeWIB();

      let notifTitle = "";
      let notifMessage = "";

      // SKENARIO 1: Jika cuma 1 tagihan (Detail)
      if (successfulInvoices.length === 1) {
        const inv = successfulInvoices[0];
        notifTitle = "Pembayaran Diterima (Web)";
        notifMessage = `${inv.user.name}\nTagihan: ${getMonthName(inv.month)} ${
          inv.year
        }\nJam: ${jamBayar}\nTotal: Rp ${inv.amount.toLocaleString("id-ID")}`;
      }
      // SKENARIO 2: Jika banyak tagihan (Breakdown list)
      else {
        notifTitle = `Pembayaran Massal (${successfulInvoices.length})`;

        // Buat list breakdown: "1. Dani (Jan) \n 2. Budi (Feb)"
        const breakdownList = successfulInvoices
          .map((inv, index) => {
            return `${index + 1}. ${inv.user.name} (${getMonthName(
              inv.month,
            )})`;
          })
          .join("\n");

        notifMessage = `${breakdownList}\n\nTotal: Rp ${totalAmount.toLocaleString(
          "id-ID",
        )}\nJam: ${jamBayar}`;
      }

      // Emit ke Stream
      notificationEmitter.emit(NOTIFICATION_EVENT, {
        title: notifTitle,
        message: notifMessage,
        type: "PAYMENT_BULK_SUCCESS",
        count: successfulInvoices.length,
      });
    }
    // -------------------------------------------------------------------

    // Kirim WA Massal (Grouping by User)
    const invoicesByUser = new Map<
      string,
      {
        invoice: Invoice & { user: User };
        pdfBuffer: Buffer;
        fileName: string;
      }[]
    >();
    for (const item of successfulInvoicesWithMeta) {
      if (!invoicesByUser.has(item.invoice.userId)) {
        invoicesByUser.set(item.invoice.userId, []);
      }
      invoicesByUser.get(item.invoice.userId)!.push(item);
    }

    const waErrorMessages: string[] = [];
    for (const [userId, items] of invoicesByUser.entries()) {
      try {
        const user = items[0].invoice.user;
        let invoiceListText = "";
        let totalPaid = 0;

        items.sort((a, b) =>
          a.invoice.year !== b.invoice.year
            ? a.invoice.year - b.invoice.year
            : a.invoice.month - b.invoice.month,
        );

        for (let i = 0; i < items.length; i++) {
          const inv = items[i].invoice;
          const periode = `${getMonthName(inv.month)} ${inv.year}`;
          invoiceListText += `${i + 1}. ${periode}\n`;
          totalPaid += inv.amount;
        }

        const message = `*TERIMA KASIH ATAS PEMBAYARAN ANDA*\n
Yth. Bapak / Ibu
*${user.name}*
${user.phone}

Kami telah menerima pembayaran tagihan internet:

${invoiceListText}
*Total Pembayaran: Rp ${totalPaid.toLocaleString("id-ID")}*

_Nota digital telah dilampirkan dalam pesan ini._

Terima kasih.
Manajemen JINDE`;

        // Gabungkan PDF jika lebih dari satu
        const pdfBuffers = items.map((i) => i.pdfBuffer);
        const mergedPdfBuffer = await mergePdfBuffers(pdfBuffers);

        const periodNames = items
          .map((i) => getMonthName(i.invoice.month).substring(0, 3))
          .join("-");
        const mergedFileName =
          items.length > 1
            ? `nota_${user.name.replace(/[^a-z0-9]/gi, "_")}_${periodNames}.pdf`
            : items[0].fileName;

        await sendWhatsAppDocument(
          user.phone,
          mergedPdfBuffer,
          mergedFileName,
          message,
        );
      } catch (error: any) {
        waErrorMessages.push(items[0].invoice.user.name);
      }
    }

    revalidatePath("/admin/tagihan");

    let successMsg = `${successfulInvoices.length} tagihan berhasil lunas.`;
    if (failedInvoiceMessages.length > 0) {
      return { success: successMsg, error: `Gagal proses beberapa tagihan.` };
    }
    return {
      success: `${successMsg} Notifikasi WA terkirim.`,
      pdfUrls: successfulPdfUrls,
    };
  } catch (error: any) {
    console.error("Gagal update status massal:", error);
    return { error: `Terjadi kesalahan: ${error.message}` };
  }
}

export async function sendBillingReminder(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        invoices: {
          where: { status: "UNPAID" },
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    if (!user || user.invoices.length === 0) {
      return {
        error: "Pelanggan tidak memiliki tagihan tertunggak.",
      };
    }

    let invoiceList = "";
    let totalTunggakan = 0;

    user.invoices.forEach((inv) => {
      const periode = `${getMonthName(inv.month)} ${inv.year}`;
      const jumlah = `Rp ${inv.amount.toLocaleString("id-ID")}`;
      invoiceList += `- Periode ${periode}: *${jumlah}*\n`;
      totalTunggakan += inv.amount;
    });

    const message = `*PENGINGAT TAGIHAN*\n
Yth. Bapak / Ibu
*${user.name}*
${user.phone}

Tagihan internet Anda yang belum terbayar:

${invoiceList}
*Total Tagihan: Rp ${totalTunggakan.toLocaleString("id-ID")}*

Mohon segera lakukan pembayaran. Terima kasih.`;

    await sendWhatsAppMessage(user.phone, message);
    return { success: `Pengingat tagihan berhasil dikirim ke ${user.name}.` };
  } catch (error: any) {
    return { error: `Gagal mengirim pengingat.` };
  }
}

// --- HELPER FUNCTION LAIN (Fetch, Broadcast, dll) TETAP SAMA ---
// (Saya sertakan untuk kelengkapan file, tapi logika tidak berubah drastis)

export async function fetchKeluhan({
  query,
  status,
  page = 1,
}: {
  query?: string;
  status?: ComplaintStatus;
  page?: number;
}) {
  // ... (Logika fetch keluhan sama seperti sebelumnya)
  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { user: { name: { contains: query, mode: "insensitive" } } },
      { subject: { contains: query, mode: "insensitive" } },
    ];
  }
  if (status) whereClause.status = status;

  try {
    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
      skip: (page - 1) * 10,
    });
    const totalCount = await prisma.complaint.count({ where: whereClause });
    const hasMore = page * 10 < totalCount;
    return { complaints, hasMore };
  } catch (error) {
    return { complaints: [], hasMore: false };
  }
}

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED",
) {
  try {
    await prisma.complaint.update({
      where: { id: complaintId },
      data: { status: newStatus },
    });
    revalidatePath("/admin/keluhan");
  } catch (error) {
    console.error(error);
  }
}

export async function fetchPaymentReport({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  if (!startDate || !endDate) return { error: "Rentang tanggal tidak valid." };
  try {
    const payments = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startDate, lte: endDate },
      },
      include: { user: { select: { name: true, idNumber: true } } },
      orderBy: { paidAt: "desc" },
    });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      payments,
      summary: { totalRevenue, paymentCount: payments.length },
    };
  } catch (error: any) {
    return { error: `Gagal mengambil data laporan.` };
  }
}

export async function sendCustomBroadcast(formData: FormData) {
  const rawMessage = formData.get("message") as string;
  const target = formData.get("target") as string;

  if (!rawMessage || rawMessage.length < 5)
    return { error: "Pesan terlalu pendek." };

  try {
    let whereClause: any = { role: "PELANGGAN" };
    if (target === "ACTIVE") whereClause.status = "ACTIVE";
    if (target === "INACTIVE") whereClause.status = "INACTIVE";

    const recipients = await prisma.user.findMany({
      where: whereClause,
      include: {
        invoices: {
          where: { status: "UNPAID" },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        },
      },
    });

    if (recipients.length === 0) return { error: "Tidak ada penerima." };

    // Buat Log Awal
    const log = await prisma.broadcastLog.create({
      data: {
        message: rawMessage,
        target,
        recipientCount: recipients.length,
        status: "PROCESSING",
      },
    });

    // Jalankan di background
    (async () => {
      let successCount = 0;
      let failedCount = 0;
      let batchCounter = 0;
      let nextBatchSize = randomInt(12, 18);

      for (let i = 0; i < recipients.length; i++) {
        const user = recipients[i];
        
        // Update Progress Real-time
        await prisma.broadcastLog.update({
          where: { id: log.id },
          data: { currentIndex: i + 1 },
        });

        // Personalisasi Pesan
        let personalizedMessage = rawMessage
          .replace(/\[NAMA\]/g, user.name || "Pelanggan")
          .replace(/\[IDPEL\]/g, user.idNumber || "-")
          .replace(
            /\[TANGGAL\]/g,
            new Date().toLocaleString("id-ID", {
              dateStyle: "long",
              timeStyle: "short",
            }),
          );

        const totalTunggakan = user.invoices.reduce(
          (sum, inv) => sum + inv.amount,
          0,
        );
        personalizedMessage = personalizedMessage.replace(
          /\[TAGIHAN\]/g,
          formatRupiah(totalTunggakan),
        );

        let sent = false;
        let errorReason = "";

        try {
          // --- Sistem TIPUAN HUMAN (Typing) ---
          await sendWhatsAppPresence(user.phone, "composing");
          // Waktu mengetik antara 3-7 detik
          await sleep(randomInt(3000, 7000));

          const result = await sendWhatsAppMessage(
            user.phone || "",
            personalizedMessage,
          );
          
          if (result.success) {
            sent = true;
          } else {
            errorReason = result.error || "Gagal kirim via gateway";
          }
        } catch (err: any) {
          errorReason = err.message || "Unknown error";
        }

        if (sent) {
          successCount++;
          batchCounter++;
          await prisma.broadcastLog.update({
            where: { id: log.id },
            data: { successCount },
          });

          // JITTER antar pesan (15-35 detik agar sangat human)
          await sleep(randomInt(15000, 35000));
        } else {
          failedCount++;
          // Catat Detail Kegagalan
          await prisma.broadcastDetail.create({
            data: {
              broadcastLogId: log.id,
              recipientName: user.name,
              recipientPhone: user.phone,
              status: "FAILED",
              reason: errorReason,
            },
          });
          await prisma.broadcastLog.update({
            where: { id: log.id },
            data: { failedCount },
          });

          // JIKA ERROR / INVALID: Langsung skip tanpa jeda (sesuai request)
        }

        // BATCHING: Jika batch tercapai, istirahat lama (random antara 5-12 menit)
        if (batchCounter >= nextBatchSize && i < recipients.length - 1) {
          console.log(`[WA] Batch ${nextBatchSize} tercapai. Istirahat...`);
          await sleep(randomInt(5 * 60 * 1000, 12 * 60 * 1000));
          batchCounter = 0;
          nextBatchSize = randomInt(12, 18); // Acak lagi batch size berikutnya
        }
      }

      // Selesai
      await prisma.broadcastLog.update({
        where: { id: log.id },
        data: { status: "COMPLETED" },
      });
      revalidatePath("/admin/broadcast");
    })();

    return {
      success: `Broadcast dimulai. Anda bisa melihat progres real-time di riwayat.`,
      logId: log.id
    };
  } catch (error) {
    return { error: "Terjadi kesalahan saat memulai broadcast." };
  }
}

/**
 * Pengingat Tagihan Otomatis (V2)
 * Digunakan untuk tanggal 27 setiap bulan
 */
export async function sendAutomatedReminders() {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const usersWithDebt = await prisma.user.findMany({
      where: {
        role: "PELANGGAN",
        status: "ACTIVE",
        invoices: {
          some: { status: "UNPAID" },
        },
      },
      include: {
        invoices: {
          where: { status: "UNPAID" },
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    if (usersWithDebt.length === 0)
      return { success: "Tidak ada tunggakan untuk diingatkan hari ini." };

    const log = await prisma.broadcastLog.create({
      data: {
        message: "AUTO_REMINDER_TGL_27",
        target: "ACTIVE_WITH_DEBT",
        recipientCount: usersWithDebt.length,
        status: "PROCESSING",
      },
    });

    // Jalankan Background Process
    (async () => {
      let successCount = 0;
      let failedCount = 0;
      let batchCounter = 0;
      let nextBatchSize = randomInt(10, 20);

      for (let i = 0; i < usersWithDebt.length; i++) {
        const user = usersWithDebt[i];

        await prisma.broadcastLog.update({
          where: { id: log.id },
          data: { currentIndex: i + 1 },
        });

        let invoiceListText = "";
        let totalDebt = 0;

        user.invoices.forEach((inv, idx) => {
          const periode = `${getMonthName(inv.month)} ${inv.year}`;
          invoiceListText += `${idx + 1}. Periode ${periode}: *${formatRupiah(inv.amount)}*\n`;
          totalDebt += inv.amount;
        });

        const timestamp = new Date().toLocaleString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const message = `*PENGINGAT TAGIHAN* (Auto-Send)\n
Yth. Bapak/Ibu *${user.name}*
ID Pelanggan: ${user.idNumber}

Kami ingin menginformasikan perihal tagihan internet Anda yang belum terbayar:

${invoiceListText}
*Total Tagihan Pembayaran: ${formatRupiah(totalDebt)}*

_Mohon segera melakukan pembayaran sebelum jatuh tempo untuk menghindari gangguan layanan._
_Abaikan pesan ini jika Anda sudah melakukan pembayaran._

*DIKIRIM PADA:* ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} jam ${timestamp} WIB
--------------------------------------
Terima kasih.`;

        let sent = false;
        let errorReason = "";

        try {
          await sendWhatsAppPresence(user.phone, "composing");
          await sleep(randomInt(2000, 6000));

          const result = await sendWhatsAppMessage(user.phone, message);
          if (result.success) {
            sent = true;
          } else {
            errorReason = result.error || "Gagal kirim via gateway";
          }
        } catch (err: any) {
          errorReason = err.message || "Unknown error";
        }

        if (sent) {
          successCount++;
          batchCounter++;
          await prisma.broadcastLog.update({
            where: { id: log.id },
            data: { successCount },
          });

          await sleep(randomInt(10000, 25000));
        } else {
          failedCount++;
          await prisma.broadcastDetail.create({
            data: {
              broadcastLogId: log.id,
              recipientName: user.name,
              recipientPhone: user.phone,
              status: "FAILED",
              reason: errorReason,
            },
          });
          await prisma.broadcastLog.update({
            where: { id: log.id },
            data: { failedCount },
          });
        }

        if (batchCounter >= nextBatchSize && i < usersWithDebt.length - 1) {
          await sleep(randomInt(4 * 60 * 1000, 8 * 60 * 1000));
          batchCounter = 0;
          nextBatchSize = randomInt(10, 20);
        }
      }

      await prisma.broadcastLog.update({
        where: { id: log.id },
        data: { status: "COMPLETED" },
      });
      revalidatePath("/admin/broadcast");
    })();

    return {
      success: `Reminder otomatis dimulai untuk ${usersWithDebt.length} pelanggan.`,
      logId: log.id
    };
  } catch (error: any) {
    console.error("Error Automated Reminder:", error);
    return { error: "Gagal memproses pengingat otomatis." };
  }
}

export async function getBroadcastHistory() {
  try {
    return await prisma.broadcastLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  } catch (error) {
    return [];
  }
}

export async function getBroadcastProgress(logId: string) {
  try {
    return await prisma.broadcastLog.findUnique({
      where: { id: logId }
    });
  } catch (error) {
    return null;
  }
}

export async function getBroadcastDetails(logId: string) {
  try {
    const log = await prisma.broadcastLog.findUnique({
      where: { id: logId },
      include: {
        details: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!log) return { error: "Log tidak ditemukan." };

    return {
      log,
      details: log.details
    };
  } catch (error) {
    return { error: "Gagal memuat detail." };
  }
}

export async function updateInvoiceDetails(
  invoiceId: string,
  data: { amount: number },
) {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { amount: data.amount },
    });
    revalidatePath("/admin/tagihan");
    return { success: "Tagihan berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui tagihan." };
  }
}

export async function deleteInvoices(invoiceIds: string[]) {
  if (!invoiceIds || invoiceIds.length === 0)
    return { error: "Pilih tagihan." };
  try {
    await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
    revalidatePath("/admin/tagihan");
    return { success: `${invoiceIds.length} tagihan dihapus.` };
  } catch (error) {
    return { error: "Gagal menghapus tagihan." };
  }
}

export async function getPaginatedAnnouncements({
  page = 1,
  limit = 10,
  search = "",
  type = "ALL",
}: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}) {
  try {
    const where: any = {
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(type !== "ALL" ? { type } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Gagal fetch announcements:", error);
    return { data: [], total: 0, totalPages: 0, currentPage: 1 };
  }
}

export async function createAnnouncement(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = (formData.get("type") as string) || "INFO";
  const isUrgent = formData.get("isUrgent") === "on";
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  if (!title || !content) {
    return { error: "Judul dan konten wajib diisi." };
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type,
        isUrgent,
        startDate: startDateStr ? new Date(startDateStr) : new Date(),
        endDate: endDateStr ? new Date(endDateStr) : null,
      },
    });

    // --- PUSH NOTIFICATION (Gotify) ---
    try {
      // Broadcast to all with type PROMO or INFO
      const { broadcastPromo } = await import("@/lib/gotify");
      await broadcastPromo(`[${type}] ${title}`, content);
    } catch (err) {
      console.error("Gotify Error:", err);
    }
    // ----------------------------------

    revalidatePath("/admin/announcement");
    revalidatePath("/");
    revalidatePath("/pelanggan", "layout");

    return { success: "Pengumuman berhasil dibuat." };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { error: "Gagal membuat pengumuman." };
  }
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const type = (formData.get("type") as string) || "INFO";
  const isUrgent = formData.get("isUrgent") === "on";
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;

  try {
    await prisma.announcement.update({
      where: { id },
      data: {
        title,
        content,
        type,
        isUrgent,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : null,
      },
    });

    revalidatePath("/admin/announcement");
    revalidatePath("/");
    revalidatePath("/pelanggan", "layout");

    return { success: "Pengumuman berhasil diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui pengumuman." };
  }
}

export async function deleteAnnouncement(id: string) {
  try {
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/admin/announcement");
    return { success: "Pengumuman berhasil dihapus." };
  } catch (error) {
    return { error: "Gagal menghapus pengumuman." };
  }
}

export async function toggleAnnouncementActive(id: string, isActive: boolean) {
  try {
    await prisma.announcement.update({
      where: { id },
      data: { isActive },
    });
    revalidatePath("/admin/announcement");
    return { success: "Status pengumuman diperbarui." };
  } catch (error) {
    return { error: "Gagal memperbarui status pengumuman." };
  }
}

// --- REFERRAL MANAGEMENT ACTIONS ---

export async function fetchReferrals({
  query,
  status,
  page = 1,
}: {
  query?: string;
  status?: string;
  page?: number;
}) {
  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { referrer: { name: { contains: query, mode: "insensitive" } } },
      { referee: { name: { contains: query, mode: "insensitive" } } },
    ];
  }
  if (status) whereClause.status = status;

  try {
    const referrals = await prisma.referral.findMany({
      where: whereClause,
      include: {
        referrer: { select: { name: true, phone: true } },
        referee: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      skip: (page - 1) * 10,
    });
    const totalCount = await prisma.referral.count({ where: whereClause });
    const hasMore = page * 10 < totalCount;
    return { referrals, hasMore };
  } catch (error) {
    console.error("Gagal fetch referrals:", error);
    return { referrals: [], hasMore: false };
  }
}

export async function updateReferralStatus(
  referralId: string,
  newStatus: "PENDING" | "APPROVED" | "REJECTED",
) {
  try {
    const ref = await prisma.referral.update({
      where: { id: referralId },
      data: { status: newStatus },
      include: { referrer: true, referee: true },
    });

    if (newStatus === "APPROVED") {
      // Send notification to referrer
      await prisma.notification.create({
        data: {
          userId: ref.referrerId,
          title: "Referral Disetujui",
          content: `Referral untuk teman Anda (${ref.referee.name}) telah disetujui! Anda akan mendapatkan potongan jika teman Anda lunas tagihan bulanannya.`,
          type: "PROMO",
        },
      });
    }

    revalidatePath("/admin/referral");
    return { success: `Referral berhasil ${newStatus.toLowerCase()}.` };
  } catch (error: any) {
    console.error("Gagal update referral status:", error);
    return { error: `Gagal memperbarui status: ${error.message}` };
  }
}

export async function getReferralCandidates() {
  try {
    const referrers = await prisma.user.findMany({
      where: { role: "PELANGGAN" },
      select: {
        id: true,
        name: true,
        idNumber: true,
        referralEntry: {
          select: { referrerId: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const referees = await prisma.user.findMany({
      where: {
        role: "PELANGGAN",
        referralEntry: null, // Hanya yang BELUM tergabung dengan siapapun
      },
      select: { id: true, name: true, idNumber: true },
      orderBy: { name: "asc" },
    });

    return { referrers, referees };
  } catch (error) {
    console.error("Gagal fetch candidates:", error);
    return { referrers: [], referees: [] };
  }
}

export async function createManualReferral(
  referrerId: string,
  refereeId: string,
) {
  try {
    if (referrerId === refereeId) {
      return { error: "Induk dan anak tidak bisa pelanggan yang sama." };
    }

    // Pastikan calon anak belum punya referral
    const existing = await prisma.referral.findUnique({
      where: { refereeId },
    });

    if (existing) {
      return { error: "Pelanggan tujuan sudah terhubung ke referral lain." };
    }

    await prisma.referral.create({
      data: {
        referrerId,
        refereeId,
        status: "APPROVED", // Admin as supervisor automatically approves
        discount: 10000,
      },
    });

    revalidatePath("/admin/referral");
    return { success: "Referral manual berhasil ditambahkan." };
  } catch (error: any) {
    console.error("Gagal create manual referral:", error);
    return { error: "Gagal memproses referral manual." };
  }
}

export async function linkGenieACSDevice(userId: string, deviceId: string) {
  try {
    await prisma.genieACSDevice.create({
      data: {
        userId,
        deviceId,
        name: "Router Utama",
      },
    });
    revalidatePath(`/admin/pelanggan/${userId}`);
    revalidatePath("/admin/pelanggan");
    return { success: "Perangkat GenieACS berhasil dihubungkan." };
  } catch (error: any) {
    console.error("Gagal menghubungkan perangkat:", error);
    if (error.code === "P2002")
      return { error: "Perangkat sudah terhubung ke pelanggan lain." };
    return { error: "Gagal menghubungkan perangkat GenieACS." };
  }
}

export async function unlinkGenieACSDevice(userId: string, deviceId: string) {
  try {
    const device = await prisma.genieACSDevice.findUnique({
      where: { deviceId },
    });
    if (!device) return { error: "Perangkat tidak ditemukan." };

    await prisma.genieACSDevice.delete({
      where: { deviceId },
    });
    revalidatePath(`/admin/pelanggan/${device.userId}`);
    revalidatePath("/admin/pelanggan");
    return { success: "Perangkat GenieACS berhasil dilepas." };
  } catch (error) {
    console.error("Gagal melepas perangkat:", error);
    return { error: "Gagal melepas perangkat GenieACS." };
  }
}

export async function renameGenieACSDevice(deviceId: string, newName: string) {
  try {
    const device = await prisma.genieACSDevice.update({
      where: { deviceId },
      data: { name: newName },
    });
    revalidatePath(`/admin/pelanggan/${device.userId}`);
    revalidatePath("/admin/pelanggan");
    return { success: "Nama perangkat berhasil diperbarui." };
  } catch (error) {
    console.error("Gagal rename perangkat:", error);
    return { error: "Gagal memperbarui nama perangkat." };
  }
}

export async function rebootGenieACSDevice(deviceId: string) {
  const { sendGenieACSTask } = await import("@/lib/genieacs");
  try {
    await sendGenieACSTask(deviceId, { name: "reboot" });
    return { success: "Perintah reboot berhasil dikirim." };
  } catch (error: any) {
    return { error: `Gagal reboot: ${error.message}` };
  }
}

export async function refreshGenieACSDevice(deviceId: string) {
  const { sendGenieACSTask } = await import("@/lib/genieacs");
  try {
    // Refresh SSID, Associated Devices, RX Power and Temperature
    await sendGenieACSTask(deviceId, {
      name: "getParameterValues",
      parameterNames: [
        "InternetGatewayDevice.LANDevice.1.Hosts.HostNumberOfEntries",
        "VirtualParameters.RXPower",
        "VirtualParameters.RXpower",
        "VirtualParameters.gettemp",
        "VirtualParameters.GetTemp",
        "VirtualParameters.getdeviceuptime",
        "VirtualParameters.GetUptime",
        "VirtualParameters.IPTR069",
        "VirtualParameters.pppoeIP",
      ],
    });

    // Tunggu sejenak agar ONT punya waktu untuk melaporkan (Inform) data terbaru ke GenieACS
    await new Promise((resolve) => setTimeout(resolve, 3000));

    revalidatePath("/admin/pelanggan", "layout"); // Revalidate current detail page
    return { success: "Data perangkat berhasil diperbarui dari ONT." };
  } catch (error: any) {
    return { error: `Gagal refresh: ${error.message}` };
  }
}

export async function changeWifiPassword(
  deviceId: string,
  passwordBaru: string,
) {
  const { sendGenieACSTask } = await import("@/lib/genieacs");
  try {
    await sendGenieACSTask(deviceId, {
      name: "setParameterValues",
      parameterValues: [
        [
          "InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase",
          passwordBaru,
          "xsd:string",
        ],
      ],
    });
    return {
      success:
        "Password WiFi berhasil diubah. Perangkat akan segera menerapkan perubahan.",
    };
  } catch (error: any) {
    return { error: `Gagal ganti password: ${error.message}` };
  }
}
