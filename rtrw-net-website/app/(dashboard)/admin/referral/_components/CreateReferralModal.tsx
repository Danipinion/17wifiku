"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, UserPlus, Search, X, Loader2, Check, ArrowRight, UserCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { getReferralCandidates, createManualReferral } from "../../actions";

export default function CreateReferralModal() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const [candidates, setCandidates] = useState<{
    referrers: any[];
    referees: any[];
  } | null>(null);

  const [referrerId, setReferrerId] = useState("");
  const [refereeId, setRefereeId] = useState("");
  
  const [searchReferrer, setSearchReferrer] = useState("");
  const [searchReferee, setSearchReferee] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = async () => {
    setIsOpen(true);
    const data = await getReferralCandidates();
    setCandidates(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    setReferrerId("");
    setRefereeId("");
    setSearchReferrer("");
    setSearchReferee("");
    setCandidates(null);
  };

  const handleSubmit = () => {
    if (!referrerId || !refereeId) {
      toast.error("Harap pilih pengajak dan teman.");
      return;
    }

    startTransition(async () => {
      const result = await createManualReferral(referrerId, refereeId);
      if (result.success) {
        toast.success(result.success);
        handleClose();
      } else {
        toast.error(result.error);
      }
    });
  };

  const filteredReferrers = candidates?.referrers.filter(u => 
    u.name.toLowerCase().includes(searchReferrer.toLowerCase()) || 
    u.idNumber?.toLowerCase().includes(searchReferrer.toLowerCase())
  );

  const selectedReferrerData = candidates?.referrers.find(r => r.id === referrerId);
  const myReferrerId = selectedReferrerData?.referralEntry?.referrerId;

  const filteredReferees = candidates?.referees.filter(u => 
    (u.name.toLowerCase().includes(searchReferee.toLowerCase()) || 
    u.idNumber?.toLowerCase().includes(searchReferee.toLowerCase())) &&
    u.id !== referrerId &&
    u.id !== myReferrerId
  );

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all active:scale-95"
      >
        <Plus size={16} />
        TAMBAH REFERRAL
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="absolute inset-0" onClick={handleClose} />
          
          <div className="relative bg-slate-900 border border-slate-800/80 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header - Compact */}
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-sm font-black text-white tracking-tight uppercase">Manual Referral</h3>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!candidates ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="text-blue-500 animate-spin" size={32} />
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Memuat data...</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                  
                  {/* STEP 1: SELECT REFERRER */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">1. SIAPA PENGAJAKNYA?</label>
                      {referrerId && <Check size={14} className="text-blue-400" />}
                    </div>

                    {!referrerId ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                          <input 
                            type="text" 
                            placeholder="Cari nama pelanggan..."
                            className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={searchReferrer}
                            onChange={(e) => setSearchReferrer(e.target.value)}
                          />
                        </div>
                        <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                          {filteredReferrers?.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => setReferrerId(u.id)}
                              className="w-full text-left p-3 rounded-xl hover:bg-slate-800/50 transition-all group"
                            >
                              <p className="text-xs font-bold text-slate-300 group-hover:text-white truncate">{u.name}</p>
                              <p className="text-[9px] font-mono text-slate-600 uppercase">{u.idNumber || "REG-USER"}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 bg-blue-600/10 border border-blue-500/30 rounded-2xl group cursor-pointer" onClick={() => {setReferrerId(""); setRefereeId("");}}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shrink-0">
                            <UserCheck size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-blue-400 truncate">{selectedReferrerData?.name}</p>
                            <p className="text-[9px] font-bold text-blue-500/60 uppercase">Pilih yang lain?</p>
                          </div>
                        </div>
                        <X size={14} className="text-blue-500 opacity-50" />
                      </div>
                    )}
                  </div>

                  {/* STEP 2: SELECT REFEREE - ONLY SHOW IF REFERRER SELECTED */}
                  {referrerId && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">2. SIAPA TEMANNYA?</label>
                        {refereeId && <Check size={14} className="text-green-400" />}
                      </div>

                      {!refereeId ? (
                        <div className="space-y-3">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                            <input 
                              type="text" 
                              placeholder="Cari nama teman..."
                              className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-green-500/20 outline-none"
                              value={searchReferee}
                              onChange={(e) => setSearchReferee(e.target.value)}
                            />
                          </div>
                          <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl h-48 overflow-y-auto custom-scrollbar p-2 space-y-1">
                            {filteredReferees?.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => setRefereeId(u.id)}
                                className="w-full text-left p-3 rounded-xl hover:bg-slate-800/50 transition-all group"
                              >
                                <p className="text-xs font-bold text-slate-300 group-hover:text-white truncate">{u.name}</p>
                                <p className="text-[9px] font-mono text-slate-600 uppercase">{u.idNumber || "REG-USER"}</p>
                              </button>
                            ))}
                            {filteredReferees?.length === 0 && (
                              <p className="text-[9px] text-center py-10 text-slate-700 font-bold uppercase">Tidak ditemukan</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3.5 bg-green-600/10 border border-green-500/30 rounded-2xl cursor-pointer" onClick={() => setRefereeId("")}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white shrink-0">
                              <UserCheck size={16} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-black text-green-400 truncate">{candidates?.referees.find(u => u.id === refereeId)?.name}</p>
                              <p className="text-[9px] font-bold text-green-500/60 uppercase">Ganti pilihan?</p>
                            </div>
                          </div>
                          <X size={14} className="text-green-500 opacity-50" />
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Modal Footer - Compact */}
            <div className="p-6 bg-slate-950/40 border-t border-slate-800/50 flex flex-col gap-3">
              <button 
                onClick={handleSubmit}
                disabled={isPending || !referrerId || !refereeId}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-2xl shadow-xl shadow-blue-900/30 transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                KONFIRMASI SEKARANG
              </button>
              <button 
                onClick={handleClose}
                className="w-full py-2 text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                disabled={isPending}
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
