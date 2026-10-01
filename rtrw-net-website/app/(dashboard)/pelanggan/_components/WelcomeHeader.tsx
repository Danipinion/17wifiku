// app/(dashboard)/pelanggan/_components/WelcomeHeader.tsx
"use client";

import { useState } from "react"; // Import useState
import { LogOut, Settings, Loader2 } from "lucide-react";
import type { Session } from "next-auth";
import { changePasswordPelanggan } from "../actions";
import { toast } from "sonner";

type WelcomeHeaderProps = {
  user: Session["user"];
  logoutAction: () => Promise<void>;
};

export function WelcomeHeader({ user, logoutAction }: WelcomeHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await changePasswordPelanggan(formData);
    if (result.success) {
      toast.success(result.success);
      setTimeout(() => setIsModalOpen(false), 1500);
    } else {
      toast.error(result.error || "Terjadi kesalahan.");
    }
    setIsSubmitting(false);
  };
  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-slate-900 rounded-lg border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Selamat Datang, {user?.name}!
          </h1>
          <p className="text-gray-400">
            Ini adalah ringkasan akun dan layanan Anda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
            title="Pengaturan Akun"
          >
            <Settings size={20} />
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modal Ganti Password */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold">Ganti Password</h3>
            </div>
            <form action={handlePasswordChange} className="p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1">Password Baru</label>
                <input
                  type="password"
                  name="newPassword"
                  required
                  className="input-style w-full"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  className="input-style w-full"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
