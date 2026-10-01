// app/api/stream/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  notificationEmitter,
  NOTIFICATION_EVENT,
} from "@/lib/notificationStream";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let isCleanedUp = false;
  let onNotificationRef: ((data: any) => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const onNotification = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          cleanup();
        }
      };
      
      onNotificationRef = onNotification;

      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        
        if (onNotificationRef) {
          notificationEmitter.off(NOTIFICATION_EVENT, onNotificationRef);
        }
        try {
          controller.close();
        } catch (e) {
          // Ignore
        }
      };

      notificationEmitter.on(NOTIFICATION_EVENT, onNotification);
      controller.enqueue(encoder.encode(": connected\n\n"));
      
      req.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      // Dipanggil saat browser memutus koneksi
      if (!isCleanedUp && onNotificationRef) {
        notificationEmitter.off(NOTIFICATION_EVENT, onNotificationRef);
        isCleanedUp = true;
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
