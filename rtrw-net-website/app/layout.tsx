// app/layout.tsx
import type { Metadata } from "next";
import { Poppins } from "next/font/google"; // Menggunakan font Poppins agar lebih modern
import "./globals.css";
import AuthProvider from "@/components/shared/AuthProvider";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Netown | Solusi Internet Komunitas",
  description:
    "Layanan Internet Cepat, Stabil, dan Terjangkau untuk Komunitas Anda.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#1e88e5" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${poppins.className} bg-slate-900 text-gray-200`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
