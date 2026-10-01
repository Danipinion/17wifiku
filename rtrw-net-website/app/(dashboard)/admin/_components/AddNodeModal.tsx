"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOLT, createODC, createConverter, createODP } from "../network-actions";
import { toast } from "sonner";
import { 
  X, 
  Network, 
  Box, 
  Router, 
  Save,
  ChevronDown,
  Server
} from "lucide-react";

interface AddNodeModalProps {
  onClose: () => void;
  olts: any[];
  odcs: any[];
  converters: any[];
  odps: any[];
  initialCoords?: { lat: number; lng: number };
}

export default function AddNodeModal({ onClose, olts, odcs, converters, odps, initialCoords }: AddNodeModalProps) {
  const [type, setType] = useState<"OLT" | "ODC" | "Converter" | "ODP">("ODC");
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      const [pType, pId] = parentId ? parentId.split(":") : [undefined, undefined];

      if (type === "OLT") {
        result = await createOLT({ name, lat: initialCoords?.lat, lng: initialCoords?.lng });
      } else if (type === "ODC") {
        result = await createODC({ 
          name, 
          lat: initialCoords?.lat, 
          lng: initialCoords?.lng,
          oltId: pType === "OLT" ? pId : undefined,
          parentOdcId: pType === "ODC" ? pId : undefined,
          parentOdpId: pType === "ODP" ? pId : undefined,
        });
      } else if (type === "Converter") {
        result = await createConverter({ 
          name, 
          odcId: pType === "ODC" ? pId : undefined, 
          oltId: pType === "OLT" ? pId : undefined,
          lat: initialCoords?.lat, 
          lng: initialCoords?.lng 
        });
      } else if (type === "ODP") {
        result = await createODP({ 
          name, 
          oltId: pType === "OLT" ? pId : undefined,
          odcId: pType === "ODC" ? pId : undefined,
          converterId: pType === "CONV" ? pId : undefined,
          parentOdpId: pType === "ODP" ? pId : undefined,
          capacity,
          lat: initialCoords?.lat,
          lng: initialCoords?.lng
        });
      }

      if (result?.success) {
        toast.success(`${type} berhasil didaftarkan`);
        router.refresh();
        onClose();
      } else {
        toast.error(result?.error || "Gagal membuat node");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#111827] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-800/50 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <header className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Tambah Node</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Konfigurasi Jaringan Baru</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white border border-transparent hover:border-slate-700"
            >
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Switcher */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/50 rounded-2xl border border-slate-800/50">
              {([
                { id: "OLT", icon: <Server className="w-3.5 h-3.5" /> },
                { id: "ODC", icon: <Network className="w-3.5 h-3.5" /> },
                { id: "Converter", icon: <Box className="w-3.5 h-3.5" /> },
                { id: "ODP", icon: <Router className="w-3.5 h-3.5" /> },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setType(t.id); setParentId(""); }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider ${
                    type === t.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t.icon}
                  <span>{t.id}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* Name Input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Label / Nama Node</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`Masukkan nama ${type}...`}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 focus:border-blue-500/50 rounded-2xl outline-none transition-all font-bold text-white placeholder:text-slate-700 text-sm shadow-inner"
                  required
                />
              </div>

              {/* Parent Selector */}
              {type !== "OLT" && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Pilih Sumber (Parent)</label>
                  <div className="relative">
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 focus:border-blue-500/50 rounded-2xl outline-none transition-all font-bold text-white appearance-none pr-10 cursor-pointer text-sm"
                    >
                      <option value="" className="bg-slate-950">-- Node Berdiri Sendiri --</option>
                      
                      <optgroup label="OLT" className="bg-slate-950 text-purple-400 font-bold">
                        {olts.map(o => (
                          <option key={o.id} value={`OLT:${o.id}`} className="bg-slate-950 text-white">{o.name}</option>
                        ))}
                      </optgroup>

                      <optgroup label="ODC HUB" className="bg-slate-950 text-blue-400 font-bold">
                        {odcs.map(o => (
                          <option key={o.id} value={`ODC:${o.id}`} className="bg-slate-950 text-white">{o.name}</option>
                        ))}
                      </optgroup>

                      {type !== "ODC" && (
                        <optgroup label="CONVERTER" className="bg-slate-950 text-emerald-400 font-bold">
                          {converters.map(c => (
                            <option key={c.id} value={`CONV:${c.id}`} className="bg-slate-950 text-white">{c.name}</option>
                          ))}
                        </optgroup>
                      )}

                      {type !== "Converter" && (
                        <optgroup label="ODP" className="bg-slate-950 text-amber-400 font-bold">
                          {odps.map(o => (
                            <option key={o.id} value={`ODP:${o.id}`} className="bg-slate-950 text-white">{o.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600 w-4 h-4" />
                  </div>
                </div>
              )}

              {/* ODP Capacity */}
              {type === "ODP" && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kapasitas Port</label>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 italic">Total port fisik</span>
                    <div className="flex items-center gap-2">
                       <input
                        type="number"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value))}
                        className="w-14 bg-slate-950 border border-slate-800 rounded-xl py-1 text-center font-black text-blue-500 outline-none focus:border-blue-500 shadow-inner text-sm"
                        min={1}
                        max={64}
                      />
                      <span className="text-[9px] font-black text-slate-700 uppercase">Port</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all hover:bg-blue-500 active:scale-[0.98] shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Daftarkan {type} Baru</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
