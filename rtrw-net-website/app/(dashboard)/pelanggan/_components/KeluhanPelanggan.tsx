// app/(dashboard)/pelanggan/_components/KeluhanPelanggan.tsx
"use client";

import { Complaint } from "@prisma/client";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type KeluhanPelangganProps = {
  complaints: Complaint[];
  submitAction: (
    formData: FormData
  ) => Promise<{ success?: string; error?: string } | void>;
};

export function KeluhanPelanggan({
  complaints,
  submitAction,
}: KeluhanPelangganProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await submitAction(formData);

    if (result?.success) {
      toast.success(result.success);
      formRef.current?.reset();
    } else if (result?.error) {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      {/* Form Pengajuan Keluhan */}
      <div className="p-6 bg-slate-900 rounded-lg border border-slate-800">
        <h2 className="text-xl font-bold mb-4">
          Ajukan Keluhan atau Permintaan
        </h2>
        <form ref={formRef} action={handleFormSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Judul Keluhan
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Koneksi Internet Lambat"
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Deskripsi Detail
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jelaskan masalah yang Anda alami secara detail..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Kirim Keluhan"
            )}
          </button>
        </form>
      </div>

      {/* Riwayat Keluhan */}
      <div className="p-6 bg-slate-900 rounded-lg border border-slate-800">
        <h2 className="text-xl font-bold mb-4">Riwayat Keluhan Anda</h2>
        <div className="space-y-3">
          {complaints.length > 0 ? (
            complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="p-4 bg-slate-800/50 rounded-md"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{complaint.subject}</p>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      complaint.status === "OPEN"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : complaint.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {complaint.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Diajukan pada:{" "}
                  {new Date(complaint.createdAt).toLocaleDateString("id-ID")}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">
              Belum ada riwayat keluhan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
