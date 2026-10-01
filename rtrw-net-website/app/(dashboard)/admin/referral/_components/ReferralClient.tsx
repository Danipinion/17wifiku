"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { Loader2, Search, Check, X, Clock } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { fetchReferrals, updateReferralStatus } from "../../actions";
import { toast } from "sonner";
import CreateReferralModal from "./CreateReferralModal";
import { UserPlus } from "lucide-react";

type ReferralWithUsers = {
  id: string;
  referrer: { name: string; phone: string };
  referee: { name: string; phone: string };
  status: "PENDING" | "APPROVED" | "REJECTED";
  discount: number;
  createdAt: Date;
};

interface ReferralClientProps {
  initialData: any[];
  hasMore: boolean;
}

export default function ReferralClient({
  initialData,
  hasMore: initialHasMore,
}: ReferralClientProps) {
  const [referrals, setReferrals] = useState<ReferralWithUsers[]>(
    initialData as any,
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [status, setStatus] = useState<string>("ALL");

  const [isPending, startTransition] = useTransition();

  const loadReferrals = useCallback(
    async (isNewSearch = false) => {
      setIsLoading(true);
      const currentPage = isNewSearch ? 1 : page + 1;
      const result = await fetchReferrals({
        query: debouncedQuery,
        status: status === "ALL" ? undefined : status,
        page: currentPage,
      });

      if (result.referrals) {
        setReferrals((prev) =>
          isNewSearch
            ? (result.referrals as any)
            : [...prev, ...(result.referrals as any)],
        );
        setHasMore(result.hasMore);
        if (!isNewSearch) setPage(currentPage);
      }
      setIsLoading(false);
    },
    [page, debouncedQuery, status],
  );

  useEffect(() => {
    setPage(1);
    loadReferrals(true);
  }, [debouncedQuery, status]);

  const handleUpdateStatus = (
    referralId: string,
    newStatus: "APPROVED" | "REJECTED",
  ) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin ${newStatus === "APPROVED" ? "menyetujui" : "menolak"} referral ini?`,
      )
    )
      return;

    startTransition(async () => {
      const result = await updateReferralStatus(referralId, newStatus);
      if (result.success) {
        toast.success(result.success);
        setReferrals((prev) =>
          prev.map((r) =>
            r.id === referralId ? { ...r, status: newStatus } : r,
          ),
        );
      } else {
        toast.error(result.error || "Gagal memperbarui status");
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      case "APPROVED":
        return "border-green-500/50 bg-green-500/10 text-green-400";
      case "REJECTED":
        return "border-red-500/50 bg-red-500/10 text-red-400";
      default:
        return "border-gray-500/50 bg-gray-500/10 text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock size={16} />;
      case "APPROVED":
        return <Check size={16} />;
      case "REJECTED":
        return <X size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <UserPlus size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Daftar Referral
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
              Total: {referrals.length} Record
            </p>
          </div>
        </div>
        <CreateReferralModal />
      </div>

      {/* Filter dan Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
        <div className="lg:col-span-3 relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            type="search"
            placeholder="Cari nama pengajak atau teman yang diajak..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm text-white transition-all placeholder:text-slate-700"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all cursor-pointer"
        >
          <option value="ALL">Semua Status</option>
          <option value="PENDING">🕒 Pending</option>
          <option value="APPROVED">✅ Disetujui</option>
          <option value="REJECTED">❌ Ditolak</option>
        </select>
      </div>

      {/* Tabel Referral */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-slate-950 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Pengajak</th>
              <th className="px-6 py-3">Teman</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {referrals.map((r) => (
              <tr
                key={r.id}
                className="hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white">
                    {r.referrer.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {r.referrer.phone}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{r.referee.name}</div>
                  <div className="text-xs text-gray-500">{r.referee.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      r.status,
                    )}`}
                  >
                    {getStatusIcon(r.status)}
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {r.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(r.id, "APPROVED")}
                        disabled={isPending}
                        className="p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-md transition-colors"
                        title="Setujui"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(r.id, "REJECTED")}
                        disabled={isPending}
                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-md transition-colors"
                        title="Tolak"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tombol Load More */}
      <div className="text-center py-4">
        {isLoading && (
          <Loader2 className="animate-spin mx-auto text-gray-400" size={28} />
        )}
        {hasMore && !isLoading && (
          <button
            onClick={() => loadReferrals()}
            className="px-6 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
          >
            Muat Lebih Banyak
          </button>
        )}
        {!hasMore && !isLoading && referrals.length > 0 && (
          <p className="text-gray-500">Sudah menampilkan semua data.</p>
        )}
        {referrals.length === 0 && !isLoading && (
          <p className="text-gray-500">
            Tidak ada data referral yang ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}
