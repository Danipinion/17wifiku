"use client";

import { useState, useTransition, useEffect } from "react";
import { claimTrial } from "./_actions"; // Panggil Server Action Anda
import {
  Zap,
  ShieldCheck,
  LifeBuoy,
  Wifi,
  CheckCircle,
  AlertTriangle, // Untuk error
  Loader2, // Untuk loading
} from "lucide-react";

// Data keunggulan yang diambil dari landing page WhyUs.tsx
const features = [
  {
    icon: Zap,
    text: "Kecepatan Tinggi & Stabil",
  },
  {
    icon: Wifi,
    text: "Unlimited Tanpa Batas Kuota (FUP)",
  },
  {
    icon: LifeBuoy,
    text: "Dukungan Teknis Cepat & Responsif",
  },
  {
    icon: ShieldCheck,
    text: "Jaringan Aman & Handal",
  },
];

// Data paket yang diambil dari landing page Pricing.tsx
const packages = [
  { speed: 12, price: 100000, isBestSeller: false },
  { speed: 15, price: 110000, isBestSeller: true },
  { speed: 20, price: 130000, isBestSeller: false },
];

// Terima mac dan ip sebagai props
export function ClaimForm({
  mac,
  ip,
}: {
  mac: string | null;
  ip: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15); // Countdown 15 detik

  // useEffect untuk timer
  useEffect(() => {
    if (!mac) {
      setCountdown(0);
      return;
    }
    if (countdown === 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [mac, countdown]); // Tambahkan countdown sebagai dependensi

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!mac || !ip) {
      setError(
        "Data MAC Address tidak ditemukan. Silakan hubungkan ulang ke WiFi."
      );
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await claimTrial(formData);
      if (result && result.error) {
        setError(result.error);
      }
    });
  };

  // Tombol disabled jika MAC tidak ada, sedang pending, atau countdown belum selesai
  const isFormDisabled = !mac || isPending || countdown > 0;

  // Teks dinamis untuk tombol
  const buttonText = isPending
    ? "Sedang Memproses..."
    : countdown > 0
    ? `Harap Tunggu (${countdown} detik)`
    : "Ya, Saya Mau Coba Gratis!";

  return (
    <main
      className="relative min-h-screen bg-cover bg-center flex items-center justify-center p-4 py-16" // Tambah padding vertikal
      style={{
        backgroundImage: "url('/background.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto p-8 md:p-12 text-center text-white bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10">
        <h1
          className="text-4xl md:text-6xl font-extrabold mb-4"
          style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.7)" }}
        >
          Satu Klik Lagi Menuju Internet Cepat!
        </h1>

        <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Selamat datang di jaringan trial kami. Rasakan sendiri bedanya—coba
          gratis 15 menit, tanpa syarat.
        </p>

        <div className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white/10 rounded-lg border border-white/20">
          <h2 className="text-2xl font-bold mb-5">Keunggulan Layanan Kami</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <feature.icon
                  className="w-6 h-6 text-blue-300 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-base font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto mb-8">
          <h2 className="text-2xl font-bold mb-2">Paket Terpopuler Kami</h2>
          <p className="text-lg text-yellow-300 font-semibold mb-6">
            PROMO PASANG BARU: GRATIS BIAYA INSTALASI!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.speed}
                className={`relative bg-slate-800/60 p-6 rounded-xl border-2 transition-all ${
                  pkg.isBestSeller
                    ? "border-blue-500 scale-105"
                    : "border-slate-700"
                }`}
              >
                {pkg.isBestSeller && (
                  <span className="absolute top-0 right-0 -mt-3 mr-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Best Seller
                  </span>
                )}
                <p className="text-lg font-semibold text-gray-300">
                  up to {pkg.speed} Mbps
                </p>
                <p className="my-2 text-4xl font-extrabold text-white">
                  Rp{new Intl.NumberFormat("id-ID").format(pkg.price)}
                </p>
                <p className="text-gray-400 text-sm">/ per bulan</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-lg mx-auto">
          {!mac && !isPending && (
            <div
              className="p-4 mb-6 text-sm text-yellow-900 bg-yellow-100 rounded-lg border border-yellow-300 flex items-center gap-3"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5" />
              <div>
                <span className="font-medium">Perangkat tidak terdeteksi!</span>
                <br />
                Silakan putuskan dan sambungkan ulang WiFi "Trial-Internet".
              </div>
            </div>
          )}

          {error && !isPending && (
            <div
              className="p-4 mb-6 text-sm text-red-900 bg-red-100 rounded-lg border border-red-300 flex items-center gap-3"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5" />
              <div>
                <span className="font-medium">Oops! Terjadi Masalah:</span>{" "}
                {error}
              </div>
            </div>
          )}

          <form className="w-full" onSubmit={handleSubmit}>
            <input type="hidden" name="mac" value={mac || ""} />
            <input type="hidden" name="ip" value={ip || ""} />

            <button
              type="submit"
              disabled={isFormDisabled}
              className="w-full py-4 px-6 text-xl font-bold text-white bg-blue-600 rounded-lg shadow-xl
                         transform transition-all duration-300
                         hover:bg-blue-700 hover:scale-105
                         focus:outline-none focus:ring-4 focus:ring-blue-300
                         disabled:bg-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isPending && (
                <Loader2 className="inline w-6 h-6 mr-2 animate-spin" />
              )}
              {buttonText}
            </button>
          </form>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10">
          <p className="text-sm text-gray-300">
            Punya pertanyaan lebih lanjut?{" "}
            <a
              href="https://wa.me/62898808475151" //
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-300 hover:underline"
            >
              Hubungi kami di WhatsApp
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
