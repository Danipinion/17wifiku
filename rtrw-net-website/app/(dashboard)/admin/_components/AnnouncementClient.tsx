"use client";

import { useTransition, useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { 
  Loader2, Trash2, Megaphone, Bell, BellOff, 
  Search, Filter, ChevronLeft, ChevronRight,
  Calendar, Clock, AlertTriangle, Info, Tag, RefreshCw
} from "lucide-react";
import { 
  createAnnouncement, 
  deleteAnnouncement, 
  toggleAnnouncementActive,
  updateAnnouncement 
} from "../actions";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  isUrgent: boolean;
  isActive: boolean;
  startDate: Date | string;
  endDate: Date | string | null;
  createdAt: Date | string;
}

export function AnnouncementClient({ 
  initialData,
  total,
  totalPages,
  currentPage,
  searchQuery,
  type: initialType
}: { 
  initialData: any[];
  total: number;
  totalPages: number;
  currentPage: number;
  searchQuery: string;
  type: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm !== searchQuery) {
        handleParamChange("q", searchTerm);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleParamChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "ALL") {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createAnnouncement(formData);
      if (result.success) {
        toast.success(result.success);
        const form = document.querySelector('form') as HTMLFormElement;
        form?.reset();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengumuman ini?")) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (result.success) {
        toast.success(result.success);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleAnnouncementActive(id, !currentStatus);
      if (result.success) {
        toast.success(result.success);
      } else {
        toast.error(result.error);
      }
    });
  };

  const getStatus = (ann: Announcement) => {
    if (!ann.isActive) return { label: "Disabled", color: "bg-slate-700 text-slate-400" };
    const now = new Date();
    const start = new Date(ann.startDate);
    const end = ann.endDate ? new Date(ann.endDate) : null;

    if (start > now) return { label: "Scheduled", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    if (end && end < now) return { label: "Expired", color: "bg-red-500/10 text-red-500 border-red-500/20" };
    return { label: "Active", color: "bg-green-500/10 text-green-500 border-green-500/20" };
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
            <Megaphone size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-black">Total Post</p>
            <p className="text-2xl font-black text-white">{total}</p>
          </div>
        </div>
        {/* Add more stats if needed */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: FORM SECTION */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
              <RefreshCw size={120} className="text-blue-500 rotate-12" />
            </div>
            
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter text-white">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bell size={18} className="text-white" />
              </div>
              Buat Pengumuman
            </h2>

            <form action={handleCreate} className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Judul Info</label>
                <input
                  name="title"
                  required
                  placeholder="Judul pengumuman..."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Kategori</label>
                  <select
                    name="type"
                    required
                    className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                  >
                    <option value="INFO">INFO</option>
                    <option value="PROMO">PROMO</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DANGER">DANGER</option>
                  </select>
                </div>
                <div className="flex items-end pb-3">
                  <label className="flex items-center gap-2 cursor-pointer group/check">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="isUrgent"
                        className="peer hidden"
                      />
                      <div className="w-5 h-5 border-2 border-slate-700 rounded-md peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center">
                        <AlertTriangle size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover/check:text-white transition-colors uppercase">Urgent?</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Konten / Isi</label>
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Detail pengumuman..."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium placeholder:text-slate-600"
                />
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
                <p className="text-[10px] font-black uppercase text-blue-500 flex items-center gap-2">
                  <Clock size={12} /> Penjadwalan Tayang
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 ml-1">Mulai Tayang</label>
                    <input
                      type="datetime-local"
                      name="startDate"
                      defaultValue={new Date().toISOString().slice(0, 16)}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 ml-1">Berakhir (Opsional)</label>
                    <input
                      type="datetime-local"
                      name="endDate"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-tighter rounded-xl disabled:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-900/20"
              >
                {isPending ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    <RefreshCw size={18} />
                    Simpan & Publish
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: LIST SECTION */}
        <div className="lg:col-span-2 space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Cari pengumuman..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={initialType}
                onChange={(e) => handleParamChange("type", e.target.value)}
                className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="INFO">INFO</option>
                <option value="PROMO">PROMO</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DANGER">DANGER</option>
              </select>
            </div>
          </div>

          {/* LIST */}
          <div className="space-y-3">
            {initialData.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-800">
                <Info size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest">Tidak ada pengumuman ditemukan</p>
              </div>
            ) : (
              initialData.map((a) => {
                const status = getStatus(a);
                const isPromo = a.type === "PROMO";
                
                return (
                  <div key={a.id} className="group p-4 bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-600/50 transition-all shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${isPromo ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"} group-hover:scale-110 transition-transform`}>
                        {isPromo ? <Tag size={20} /> : <Info size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-base tracking-tight truncate">{a.title}</h3>
                          {a.isUrgent && (
                            <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded shadow-sm">Urgent</span>
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">{a.content}</p>
                        
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] text-slate-500 font-bold uppercase border-t border-slate-800 pt-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(a.startDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {a.endDate && (
                            <span className="flex items-center gap-1 text-slate-600">
                              <ChevronRight size={12} />
                              S/D {new Date(a.endDate).toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleToggle(a.id, a.isActive)}
                          disabled={isPending}
                          className={`p-2 rounded-lg transition-all ${
                            a.isActive ? "bg-green-500/10 text-green-500" : "bg-slate-800 text-slate-500"
                          } hover:scale-105`}
                          title={a.isActive ? "Nonaktifkan" : "Aktifkan"}
                        >
                          {a.isActive ? <Bell size={18} /> : <BellOff size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={isPending}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-105"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 mt-6">
                <p className="text-xs text-slate-500 font-bold uppercase">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isPending}
                    className="p-2 bg-slate-800 text-white rounded-lg disabled:opacity-30 transition-all hover:bg-slate-700"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isPending}
                    className="p-2 bg-slate-800 text-white rounded-lg disabled:opacity-30 transition-all hover:bg-slate-700"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
