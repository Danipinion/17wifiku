import { NextResponse } from "next/server";
import { runMonitoring } from "@/lib/monitoring";

/**
 * Route API untuk memantau status perangkat dan mengirimkan peringatan ke WhatsApp Group.
 * Dirancang untuk dipanggil dari Cron via Docker.
 * Gunakan SECRET dari .env untuk keamanan.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  const CRON_SECRET = process.env.CRON_SECRET || "rtrw_secret_123";

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Jalankan monitoring asisten
    await runMonitoring();
    
    return NextResponse.json({ 
        success: true, 
        message: "Monitoring assistant check complete.",
        timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Cron Monitor error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
