// app/(dashboard)/admin/_components/KeluhanClient.tsx
"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { Complaint, ComplaintStatus } from "@prisma/client";
import { Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { fetchKeluhan } from "../actions";

type ComplaintWithUser = Complaint & {
  user: { name: string | null; phone: string };
};

type KeluhanClientProps = {
  fetchKeluhanAction: typeof fetchKeluhan;
  updateStatusAction: (
    complaintId: string,
    newStatus: ComplaintStatus
  ) => Promise<void>;
};

export function KeluhanClient({
  fetchKeluhanAction,
  updateStatusAction,
}: KeluhanClientProps) {
  const [complaints, setComplaints] = useState<ComplaintWithUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [status, setStatus] = useState<ComplaintStatus | "ALL">("ALL");

  const [isPending, startTransition] = useTransition();

  const loadKeluhan = useCallback(
    async (isNewSearch = false) => {
      setIsLoading(true);
      const currentPage = isNewSearch ? 1 : page;
      const result = await fetchKeluhanAction({
        query: debouncedQuery,
        status: status === "ALL" ? undefined : status,
        page: currentPage,
      });

      if (result.complaints) {
        setComplaints((prev) =>
          isNewSearch ? result.complaints! : [...prev, ...result.complaints!]
        );
        setHasMore(result.hasMore);
        if (!isNewSearch) setPage((p) => p + 1);
      }
      setIsLoading(false);
    },
    [page, debouncedQuery, status, fetchKeluhanAction]
  );

  useEffect(() => {
    setComplaints([]);
    setPage(1);
    setHasMore(true);
    loadKeluhan(true);
  }, [debouncedQuery, status]); // dependensi loadKeluhan dihilangkan untuk kontrol manual

  const handleUpdateStatus = (
    complaintId: string,
    newStatus: ComplaintStatus
  ) => {
    startTransition(async () => {
      await updateStatusAction(complaintId, newStatus);
      // Optimistic UI update
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, status: newStatus } : c
        )
      );
    });
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case "OPEN":
        return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
      case "IN_PROGRESS":
        return "border-blue-500/50 bg-blue-500/10 text-blue-400";
      case "RESOLVED":
        return "border-green-500/50 bg-green-500/10 text-green-400";
      default:
        return "border-gray-500/50 bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter dan Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <input
            type="search"
            placeholder="Cari nama pelanggan atau subjek..."
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 input-style"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="select-style"
        >
          <option value="ALL">Semua Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Daftar Keluhan (Kartu) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complaints.map((c) => (
          <div
            key={c.id}
            className={`flex flex-col bg-slate-900 rounded-lg border ${getStatusColor(
              c.status
            )}`}
          >
            <div className="p-4 border-b border-slate-800">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-white pr-4">{c.subject}</h3>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                    c.status
                  )}`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Oleh:{" "}
                <span className="font-semibold text-gray-300">
                  {c.user.name}
                </span>{" "}
                ({c.user.phone})
              </p>
            </div>
            <div className="p-4 flex-grow">
              <p className="text-sm text-gray-300 whitespace-pre-wrap">
                {c.description}
              </p>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-gray-500">
                {new Date(c.createdAt).toLocaleString("id-ID")}
              </span>
              <select
                value={c.status}
                onChange={(e) =>
                  handleUpdateStatus(c.id, e.target.value as ComplaintStatus)
                }
                disabled={isPending || c.status === "RESOLVED"}
                className="select-style !text-xs !py-1 !px-2 bg-slate-800"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol Load More dan Indikator Loading */}
      <div className="text-center py-4">
        {isLoading && (
          <Loader2 className="animate-spin mx-auto text-gray-400" size={28} />
        )}
        {hasMore && !isLoading && (
          <button
            onClick={() => loadKeluhan()}
            className="px-6 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 rounded-md"
          >
            Muat Lebih Banyak
          </button>
        )}
        {!hasMore && !isLoading && complaints.length > 0 && (
          <p className="text-gray-500">Sudah menampilkan semua data.</p>
        )}
        {complaints.length === 0 && !isLoading && (
          <p className="text-gray-500">
            Tidak ada data keluhan yang ditemukan.
          </p>
        )}
      </div>
    </div>
  );
}
