// app/offline/page.tsx
import { WifiOff } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-slate-950 p-6">
      <WifiOff className="w-24 h-24 text-red-500 mb-6" />
      <h1 className="text-4xl font-bold text-white mb-3">
        Anda Sedang Offline
      </h1>
      <p className="text-lg text-gray-400 max-w-md mb-8">
        Koneksi internet Anda terputus. Silakan periksa jaringan Anda dan coba
        lagi.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Kembali ke Halaman Utama
      </Link>
    </div>
  );
}
