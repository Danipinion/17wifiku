// components/landing/Pricing.tsx
"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";

// Kita definisikan data paket di sini agar mudah diubah di kemudian hari
const packages = [
  { speed: 12, price: 100000, isBestSeller: false },
  { speed: 15, price: 110000, isBestSeller: true },
  { speed: 20, price: 130000, isBestSeller: false },
  { speed: 25, price: 150000, isBestSeller: false },
  { speed: 30, price: 170000, isBestSeller: false },
];

const features = [
  "Sudah termasuk pajak",
  "Unlimited tanpa FUP (Fair Usage Policy)",
  "Jaringan 100% Fiber Optic",
  "Perangkat dipinjamkan selama berlangganan",
  "Dukungan teknis responsif",
  "Khusus untuk pemasangan baru",
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-slate-950">
      <div className="container mx-auto px-6 text-center">
        {/* Judul dan Promo Utama */}
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Pilihan Paket Internet Terbaik
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Nikmati promo pasang internet dengan harga lebih hemat. Pilih paket
            yang paling sesuai dengan kebutuhan Anda.
          </p>
          <div className="mt-6 inline-block bg-yellow-400/10 border-2 border-yellow-500 rounded-lg px-6 py-3">
            <h3 className="text-2xl font-bold text-yellow-400">
              PROMO PASANG BARU: GRATIS BIAYA INSTALASI!
            </h3>
          </div>
        </div>

        {/* Grid Paket Harga */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pkg) => (
            <div
              key={pkg.speed}
              className={`relative bg-slate-900 rounded-2xl border-2 p-8 transform transition-transform duration-300 hover:scale-105 hover:border-blue-500
                ${
                  pkg.isBestSeller
                    ? "border-blue-500 scale-105"
                    : "border-slate-800"
                }`}
            >
              {/* Badge Best Seller */}
              {pkg.isBestSeller && (
                <div className="absolute top-0 right-0 mr-4 -mt-4">
                  <span className="bg-red-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase shadow-lg">
                    Best Seller
                  </span>
                </div>
              )}

              <p className="text-lg font-semibold text-gray-400">
                up to {pkg.speed} Mbps
              </p>
              <p className="my-4 text-5xl font-extrabold text-white">
                Rp{new Intl.NumberFormat("id-ID").format(pkg.price)}
              </p>
              <p className="text-gray-500 -mt-2">/ per bulan</p>

              <Link
                href="#contact"
                className={`mt-8 block w-full py-3 px-6 rounded-lg font-semibold transition-colors
                ${
                  pkg.isBestSeller
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                }`}
              >
                Langganan Sekarang
              </Link>
            </div>
          ))}
        </div>

        {/* Daftar Keunggulan & CTA */}
        <div className="mt-16 max-w-4xl mx-auto text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle
                  className="text-green-500 flex-shrink-0"
                  size={20}
                />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center p-8 bg-blue-600/10 border border-blue-500 rounded-2xl">
            <h3 className="text-3xl font-extrabold text-white">
              CUKUP BAYAR ABUNEMEN SAJA
            </h3>
            <p className="mt-2 text-blue-300 text-lg">
              Tanpa biaya tambahan tersembunyi. Transparan dan terpercaya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
