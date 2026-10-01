// app/api/mobile/push-relay/route.ts
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * SSE Push Relay for Gotify
 * Acts as a proxy because Gotify is on a private network (10.0.0.102)
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const clientToken = req.nextUrl.searchParams.get("token");
  const GOTIFY_URL = process.env.GOTIFY_URL || "http://10.0.0.102:8081";

  if (!clientToken) {
    return new Response("Gotify Client Token is required", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // 1. Inisialisasi lastId. Gunakan 'since' dari client jika ada (untuk resume)
      const clientSince = req.nextUrl.searchParams.get("since");
      let lastId = (clientSince && clientSince !== "0") ? parseInt(clientSince) : 0;

      // Jika client tidak kirim since, cari pesan terakhir saat ini
      if (lastId <= 0) {
        try {
          const initRes = await fetch(`${GOTIFY_URL}/message?limit=1`, {
            headers: { "X-Gotify-Key": clientToken },
            cache: "no-store",
          });
          const initData = await initRes.json();
          if (initData.messages?.length > 0) {
            // "Penyakit" Sembuh: Mulai dari ID terakhir - 1 agar tidak terjepit
            lastId = initData.messages[0].id - 1;
          }
        } catch (e) {}
      }

      console.log(`[PushRelay] Stream started. lastId: ${lastId}`);

      let keepRunning = true;
      req.signal.addEventListener("abort", () => {
        keepRunning = false;
        console.log("[PushRelay] Client disconnected");
      });

      // 2. Loop polling yang aman
      while (keepRunning) {
        try {
          // Heartbeat setiap iterasi (Wajib untuk bypass proxy/tunnel buffering)
          controller.enqueue(encoder.encode(": heartbeat\n\n"));

          // Kita ambil 50 pesan terbaru (Manual Filter lebih aman daripada query 'since' yang sering dicache)
          const fetchUrl = `${GOTIFY_URL}/message?limit=50&t=${Date.now()}`;
          
          const res = await fetch(fetchUrl, {
            headers: { "X-Gotify-Key": clientToken },
            cache: "no-store",
          });

          if (res.ok) {
            const data = await res.json();
            const messages = data.messages || [];

            // Urutkan ID terkecil ke terbesar
            messages.sort((a: any, b: any) => a.id - b.id);

            for (const msg of messages) {
              // HANYA TERUSKAN JIKA BELUM PERNAH DILIHAT HP
              if (msg.id > lastId) {
                console.log(`[PushRelay] Forwarding new message ID: ${msg.id}`);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
                lastId = msg.id; // Update lastId di server
              }
            }
          }
        } catch (err: any) {
          console.error("[PushRelay] Iteration error:", err.message);
        }

        // Tunggu 2 detik sebelum periksa kembali (Agresif tapi Aman)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      
      try { controller.close(); } catch (e) {}
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
