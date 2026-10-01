"use client";

import { useEffect } from "react";
import { toast } from "sonner"; // Menggunakan library toast yang sudah ada di package.json Anda

export function NotificationListener() {
  useEffect(() => {
    // Membuka koneksi ke stream
    const eventSource = new EventSource("/api/stream/notifications");

    eventSource.onopen = () => {
      console.log("SSE Connected");
    };

    eventSource.onmessage = (event) => {
      // Abaikan pesan keep-alive
      if (event.data === ": keep-alive") return;
      if (event.data === ": connected") return;

      try {
        const data = JSON.parse(event.data);

        // Tampilkan Toast Notifikasi
        toast.success(data.title, {
          description: data.message,
          duration: 5000, // Muncul selama 5 detik
          position: "top-right",
        });

        // Opsional: Bunyikan suara notifikasi di web
        playNotificationSound();
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return null; // Komponen ini tidak merender UI visual, hanya logic
}

function playNotificationSound() {
  // Suara "Ting" sederhana
  try {
    const audio = new Audio("/sounds/notification.mp3"); // Pastikan ada file ini, atau gunakan URL online
    // Jika tidak ada file, bisa pakai base64 beep pendek atau abaikan saja
    audio.play().catch((e) => console.log("Audio play blocked", e));
  } catch (e) {
    // Ignore
  }
}
