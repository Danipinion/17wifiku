"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  MapPin,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Job {
  id: string;
  user: { name: string };
  jobType: { name: string; price: number };
  date: string;
  status: string;
  evidence: string;
  notes: string;
  latitude?: number;
  longitude?: number;
}

export default function JobHistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/jobs"); // Fetches all
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      toast.error("Gagal mengambil riwayat pekerjaan");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900/50">
            <CheckCircle size={12} /> Selesai
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-900/50">
            <XCircle size={12} /> Ditolak
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-900/50">
            <Clock size={12} /> Menunggu
          </span>
        );
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.user.name.toLowerCase().includes(search.toLowerCase()) ||
      job.jobType.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Riwayat Pekerjaan</h1>
        <p className="text-gray-400">
          Daftar semua pekerjaan yang telah dikerjakan
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari nama teknisi atau jenis pekerjaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-slate-950 text-gray-300">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Teknisi</th>
                <th className="px-4 py-3">Pekerjaan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Komisi</th>
                <th className="px-4 py-3 text-center">Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data riwayat
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-white font-medium">
                        {format(new Date(job.date), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(job.date), "HH:mm", { locale: id })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{job.user.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-white">{job.jobType.name}</div>
                      {job.notes && (
                        <div className="text-xs text-gray-500 italic max-w-[200px] truncate">
                          "{job.notes}"
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                    <td className="px-4 py-3 text-right font-medium text-green-400">
                      Rp {job.jobType.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {job.evidence ? (
                          <a
                            href={job.evidence}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-gray-300"
                            title="Lihat Foto"
                          >
                            <ImageIcon size={16} />
                          </a>
                        ) : null}
                        {job.latitude && job.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${job.latitude},${job.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-blue-400"
                            title="Lihat Lokasi"
                          >
                            <MapPin size={16} />
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
