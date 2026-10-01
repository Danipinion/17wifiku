// --- Komponen Client untuk Form ---
"use client";
import { claimTrial } from "@/app/_actions";
import { use, useState, useTransition } from "react";

// Dibuat terpisah agar bisa menggunakan hook
export function ClaimForm({
  mac,
  ip,
}: {
  mac: string | null;
  ip: string | null;
}) {
  // useTransition untuk menangani loading state
  const [isPending, startTransition] = useTransition();
  // useState untuk menangkap pesan error
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); // Bersihkan error sebelumnya

    if (!mac || !ip) {
      setError(
        "Data MAC Address tidak ditemukan. Silakan hubungkan ulang ke WiFi."
      );
      return;
    }

    const formData = new FormData(event.currentTarget);

    // Jalankan Server Action di dalam transition
    startTransition(async () => {
      const result = await claimTrial(formData);
      if (result && result.error) {
        setError(result.error);
      }
      // Jika sukses, server action akan me-redirect otomatis
    });
  };

  // Cek apakah form valid untuk di-submit
  const isFormDisabled = !mac || isPending;

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center text-gray-900">
        Klaim Trial Internet!
      </h1>
      <p className="text-center text-gray-600">
        Nikmati koneksi internet super cepat 15 menit dari kami.
      </p>

      {/* === TAMPILAN ERROR (WARNA BIRU) === */}
      {/* 1. Error jika MAC tidak terdeteksi */}
      {!mac && !isPending && (
        <div
          className="p-4 text-sm text-blue-900 bg-blue-100 rounded-lg border border-blue-300"
          role="alert"
        >
          <span className="font-medium">Perangkat tidak terdeteksi!</span>
          Silakan putuskan dan sambungkan ulang WiFi "Trial-Internet".
        </div>
      )}

      {/* 2. Error dari Server (jika ada) */}
      {error && !isPending && (
        <div
          className="p-4 text-sm text-blue-900 bg-blue-100 rounded-lg border border-blue-300"
          role="alert"
        >
          <span className="font-medium">Oops!</span> {error}
        </div>
      )}
      {/* =================================== */}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Input tersembunyi untuk data dari MikroTik */}
        <input type="hidden" name="mac" value={mac || ""} />
        <input type="hidden" name="ip" value={ip || ""} />

        <button
          type="submit"
          disabled={isFormDisabled}
          className="w-full py-3 px-4 font-semibold text-white bg-blue-600 rounded-md shadow-md
                     hover:bg-blue-700 
                     focus:outline-none focus:ring-4 focus:ring-blue-300
                     disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? "Sedang Memproses..." : "Klaim Sekarang!"}
        </button>
      </form>
    </div>
  );
}
