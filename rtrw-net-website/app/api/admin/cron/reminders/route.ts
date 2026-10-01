import { NextResponse } from "next/server";
import { sendAutomatedReminders } from "@/app/(dashboard)/admin/actions";

/**
 * API Route untuk memicu pengingat tagihan otomatis.
 * Amankan dengan CRON_SECRET atau API_KEY jika diletakkan di internet.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  // Ganti dengan secret Anda di .env untuk keamanan
  const CRON_SECRET = process.env.CRON_SECRET || "rtrw_secret_123";

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendAutomatedReminders();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
