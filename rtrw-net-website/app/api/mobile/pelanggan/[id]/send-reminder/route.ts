import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/api-auth";
import { getMonthName, sendWhatsAppMessage } from "@/lib/billingHelpers";

// POST: /api/mobile/pelanggan/[id]/send-reminder
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { session, error } = await getAdminSession(request);
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          where: { status: "UNPAID" },
          orderBy: [{ year: "asc" }, { month: "asc" }],
        },
      },
    });

    if (!user || user.invoices.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada tagihan tertunggak" },
        { status: 404 },
      );
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
${user.address || ""}

Kami ingin mengingatkan mengenai beberapa tagihan internet Anda yang telah jatuh tempo:

${invoiceList}
*Total Tagihan Pembayaran: Rp ${totalTunggakan.toLocaleString("id-ID")}*

Mohon untuk segera melakukan pembayaran agar layanan internet Anda tetap berjalan lancar.

Terima kasih.`;

    const result = await sendWhatsAppMessage(user.phone, message);
    if (!result.success) throw new Error(result.error);

    return NextResponse.json({ success: true, message: "Pengingat terkirim" });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 },
    );
  }
}
