// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Loader2 } from "lucide-react";

const LoginPage = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        identifier,
        password,
      });

      if (result?.error) {
        setError("Nomor HP atau password salah. Silakan coba lagi.");
        setIsLoading(false);
      } else if (result?.ok) {
        // Jika berhasil, arahkan ke halaman dashboard pelanggan
        // Nanti bisa ditambahkan logika role-based redirect
        router.push("/pelanggan");
        router.refresh(); // Refresh state server
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError("Terjadi kesalahan. Silakan coba beberapa saat lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Login Pelanggan</h1>
          <p className="text-gray-400">Masukkan nomor HP dan password Anda.</p>
        </div>

        {error && (
          <div className="p-3 text-center text-sm text-red-400 bg-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="identifier"
              className="text-sm font-medium text-gray-300 block mb-2"
            >
              Nomor HP
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="081234567890"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-300 block mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center py-2.5 px-4 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-900 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            <span>{isLoading ? "Memproses..." : "Login"}</span>
          </button>
        </form>
        <p className="text-sm text-center text-gray-400">
          Belum punya akun? Hubungi{" "}
          <Link
            href="/#contact"
            className="font-medium text-blue-500 hover:underline"
          >
            Admin
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
