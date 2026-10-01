"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2, MapPin, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  user: { name: string };
  jobType: { name: string; price: number };
  date: string;
  status: string;
  evidence: string;
  adminPhoto?: string;
  instruction?: string;
  notes: string;
  latitude?: number;
  longitude?: number;
  targetLatitude?: number;
  targetLongitude?: number;
}

export default function JobApprovalPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const res = await fetch("/api/jobs?status=PENDING");
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      toast.error("Gagal mengambil data pekerjaan pending");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (!res.ok) throw new Error("Gagal menyetujui pekerjaan");
      toast.success("Pekerjaan telah disetujui!");
      fetchPendingJobs();
    } catch (error) {
      toast.error("Gagal menyetujui pekerjaan");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (!res.ok) throw new Error("Gagal menolak pekerjaan");
      toast.success("Pekerjaan telah ditolak.");
      fetchPendingJobs();
    } catch (error) {
      toast.error("Gagal menolak pekerjaan");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Approval Pekerjaan</h1>
        <p className="text-gray-400">
          Verifikasi laporan pekerjaan dari teknisi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
            <Check className="w-12 h-12 mb-3 opacity-20" />
            <p>Tidak ada pekerjaan pending</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-lg">
                    {job.jobType.name}
                  </h3>
                  <p className="text-sm text-blue-400 font-medium">
                    Teknisi: {job.user.name}
                  </p>
                </div>
                <div className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded font-medium border border-yellow-500/20">
                  PENDING
                </div>
              </div>

              <div className="p-4 flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Tanggal</p>
                    <p className="text-gray-300">
                      {new Date(job.date).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Komisi</p>
                    <p className="text-green-400 font-medium">
                      Rp {job.jobType.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {job.instruction && (
                  <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-900/30">
                    <p className="text-xs text-blue-400 mb-1 font-bold">
                      Instruksi Admin:
                    </p>
                    <p className="text-sm text-blue-300">{job.instruction}</p>
                    {job.adminPhoto && (
                      <a
                        href={job.adminPhoto}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-2 text-xs text-blue-400 hover:underline"
                      >
                        Lihat Foto Referensi
                      </a>
                    )}
                    {job.targetLatitude && job.targetLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${job.targetLatitude},${job.targetLongitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-1 text-xs text-blue-400 hover:underline"
                      >
                        Lihat Lokasi Target (Maps)
                      </a>
                    )}
                  </div>
                )}

                {job.notes && (
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    <p className="text-xs text-gray-500 mb-1">
                      Laporan Teknisi:
                    </p>
                    <p className="text-sm text-gray-300 italic">
                      "{job.notes}"
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {job.evidence ? (
                    <a
                      href={job.evidence}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <ImageIcon size={14} /> Bukti Foto
                    </a>
                  ) : (
                    <span className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800/50 rounded-lg text-xs text-gray-500 cursor-not-allowed">
                      <ImageIcon size={14} /> No Foto
                    </span>
                  )}

                  {job.latitude && job.longitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${job.latitude},${job.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-blue-400 transition-colors"
                    >
                      <MapPin size={14} /> Lokasi
                    </a>
                  ) : (
                    <span className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800/50 rounded-lg text-xs text-gray-500 cursor-not-allowed">
                      <MapPin size={14} /> No Lokasi
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleReject(job.id)}
                  className="py-2 px-4 bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X size={16} /> Tolak
                </button>
                <button
                  onClick={() => handleApprove(job.id)}
                  className="py-2 px-4 bg-green-900/20 hover:bg-green-900/40 text-green-500 border border-green-900/50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Terima
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
