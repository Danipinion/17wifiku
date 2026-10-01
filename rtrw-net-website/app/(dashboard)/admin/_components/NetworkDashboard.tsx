"use client";

import { useState, useMemo, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { 
  Network, 
  Map as MapIcon, 
  Plus, 
  Box,
  Router,
  Zap,
  LayoutDashboard,
  MapPin,
  Users
} from "lucide-react";
import AddNodeModal from "./AddNodeModal";
import { updateCustomerLocation, updateNodeLocation } from "../network-actions";
import { toast } from "sonner";

// Dynamically import map to avoid SSR issues
const NetworkMap = dynamic(() => import("./NetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800 animate-pulse">
      <div className="flex flex-col items-center gap-6">
        <div className="p-6 bg-slate-800 rounded-3xl shadow-2xl">
          <MapIcon className="w-12 h-12 text-blue-500 animate-bounce" />
        </div>
        <div className="space-y-2 text-center">
          <p className="font-bold text-white tracking-tight text-xl">Inisialisasi Grid Jaringan</p>
          <p className="text-slate-500 font-medium text-sm">Sedang mengkalibrasi infrastruktur Madiun...</p>
        </div>
      </div>
    </div>
  ),
});

interface NetworkDashboardProps {
  data: any;
}

export default function NetworkDashboard({ data }: NetworkDashboardProps) {
  const [view, setView] = useState<"map" | "stats">("map");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: -7.685696285902106, lng: 111.60228212949397 });
  const [focusTarget, setFocusTarget] = useState<{ lat: number, lng: number, id: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Helper for currency
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

    // Derive simple counts & find unmapped items & ODP stats
    const { stats, unmapped, allODPStats, allConverters } = useMemo(() => {
      let activeUsersCount = 0;
      let totalODCs = data.odcs?.length || 0;
      let totalConvertersCount = 0;
      let unmappedItems: any[] = [];
      let odpStats: any[] = [];
      let convertersList: any[] = [];

      // Process ODCs and Converters for unmapped and stats
      data.odcs?.forEach((odc: any) => {
        if (!odc.latitude) unmappedItems.push({ type: "ODC", id: odc.id, name: odc.name });
        
        odc.converters?.forEach((c: any) => {
          totalConvertersCount++;
          convertersList.push(c);
          if (!c.latitude) unmappedItems.push({ type: "Converter", id: c.id, name: c.name });
        });
      });

      // Process ALL ODPs (Cascading supported)
      data.allODPs?.forEach((odp: any) => {
        const activeInODP = odp.users.filter((u: any) => u.status === "ACTIVE").length;
        const totalROI = odp.users.reduce((acc: number, u: any) => acc + (u.abonemen || 0) - (u.potongan || 0), 0);
        
        // Find children to count port usage
        const childOdpsCount = data.allODPs.filter((o: any) => o.parentOdpId === odp.id).length;
        const totalOccupiedPorts = odp.users.length + childOdpsCount;

        // Find Parent Name
        let parentName = "Unmapped";
        if (odp.parentOdpId) {
          const p = data.allODPs.find((o: any) => o.id === odp.parentOdpId);
          parentName = p ? `Casc: ${p.name}` : "Cascade (Loster)";
        } else if (odp.converterId) {
          const c = convertersList.find(c => c.id === odp.converterId);
          parentName = c ? `Conv: ${c.name}` : "Converter (Loster)";
        } else if (odp.odcId) {
          const o = data.odcs.find((o: any) => o.id === odp.odcId);
          parentName = o ? `ODC: ${o.name}` : "ODC (Loster)";
        }

        odpStats.push({ 
          id: odp.id, 
          name: odp.name, 
          parent: parentName, 
          capacity: odp.capacity || 8, 
          occupied: totalOccupiedPorts,
          active: activeInODP,
          roi: totalROI,
          lat: odp.latitude,
          lng: odp.longitude
        });

        activeUsersCount += activeInODP;
        if (!odp.latitude) unmappedItems.push({ type: "ODP", id: odp.id, name: odp.name });
      });

      // Process Standalone Users (not in ODP)
      data.odcs?.forEach((odc: any) => {
        odc.converters?.forEach((c: any) => {
          c.users?.forEach((u: any) => {
            if (u.status === "ACTIVE") activeUsersCount++;
            if (!u.latitude) unmappedItems.push({ type: "User", id: u.id, name: u.name });
          });
        });
        odc.users?.forEach((u: any) => {
          if (u.status === "ACTIVE") activeUsersCount++;
          if (!u.latitude) unmappedItems.push({ type: "User", id: u.id, name: u.name });
        });
      });

      data.standaloneUsers?.forEach((u: any) => {
        if (u.status === "ACTIVE") activeUsersCount++;
        if (!u.latitude) unmappedItems.push({ type: "User", id: u.id, name: u.name });
      });

      return { 
        stats: { activeUsers: activeUsersCount, totalODCs, totalODPs: data.allODPs?.length || 0, totalConverters: totalConvertersCount }, 
        unmapped: unmappedItems, 
        allODPStats: odpStats,
        allConverters: convertersList
      };
    }, [data]);

  const filteredODPs = allODPStats.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.parent.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewOnMap = (lat: any, lng: any) => {
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);
    
    if (isNaN(nLat) || isNaN(nLng)) {
      toast.error("Koordinat tidak valid (NaN)");
      return;
    }

    setFocusTarget({ lat: nLat, lng: nLng, id: Math.random().toString() });
    setView("map");
  };

  const handlePlaceNode = async (item: { type: string, id: string }) => {
    startTransition(async () => {
      let result;
      if (item.type === "User") {
        result = await updateCustomerLocation(item.id, mapCenter.lat, mapCenter.lng);
      } else {
        result = await updateNodeLocation(item.type as any, item.id, mapCenter.lat, mapCenter.lng);
      }

      if (result.success) {
        toast.success(`${item.type} berhasil diletakkan di tengah peta`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6 max-w-[1700px] mx-auto min-h-screen">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Network className="w-8 h-8 text-blue-500" /> Infrastructure Mapping
          </h1>
          <p className="text-slate-400 mt-1">Kelola dan pantau sebaran infrastruktur Madiun Raya.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setView("map")}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                view === "map" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-4 h-4" /> Map
            </button>
            <button 
              onClick={() => setView("stats")}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                view === "stats" ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" /> Statistics
            </button>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-slate-200 transition-all flex items-center gap-2 shadow-xl"
          >
            <Plus className="w-5 h-5" /> Add Infrastructure
          </button>
        </div>
      </div>

      {/* Map View */}
      <div className={view === "map" ? "block" : "hidden"}>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            <NetworkMap 
              data={data} 
              onCenterChange={setMapCenter} 
              forceCenter={focusTarget} 
            />
          </div>

          {unmapped.length > 0 && (
            <div className="w-full lg:w-80 flex flex-col gap-4">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-full max-h-[calc(100vh-250px)]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-white text-lg">Belum Terplot</h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {unmapped.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="group p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-slate-700/50 border-dashed transition-all text-left">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{item.type}</p>
                          <h4 className="font-bold text-white text-sm line-clamp-1">{item.name}</h4>
                        </div>
                        <button 
                          onClick={() => handlePlaceNode(item)}
                          className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                          title="Letakkan di tengah peta"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                    *Klik ikon (+) untuk meletakkan titik di tengah peta Anda saat ini.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {[
            { icon: <Network className="w-6 h-6" />, label: "Pusat ODC", value: stats.totalODCs, color: "blue" },
            { icon: <Box className="w-6 h-6" />, label: "Sub Converter", value: stats.totalConverters, color: "emerald" },
            { icon: <Router className="w-6 h-6" />, label: "Titik ODP", value: stats.totalODPs, color: "amber" },
            { icon: <LayoutDashboard className="w-6 h-6" />, label: "Pelanggan Aktif", value: stats.activeUsers, color: "indigo" },
          ].map((stat, i) => (
            <div key={i} className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg flex flex-col gap-4">
              <div className={`p-3 bg-${stat.color}-500/10 text-${stat.color}-400 rounded-xl w-fit`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1 tabular-nums">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats View */}
      <div className={view === "stats" ? "block" : "hidden"}>
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Box className="w-6 h-6 text-yellow-500" /> ODP ROI & Capacity Analysis
              </h2>
              <div className="relative w-64">
                <input 
                  type="text"
                  placeholder="Cari ODP atau Induk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white pl-10 focus:border-blue-500 outline-none"
                />
                <MapIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 text-left">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-800/50 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nama ODP</th>
                    <th className="px-6 py-4">Parent Hub</th>
                    <th className="px-6 py-4">Progress Kapasitas</th>
                    <th className="px-6 py-4">Aktif</th>
                    <th className="px-6 py-4">Pendapatan (ROI)</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredODPs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500 italic">Tidak ada ODP ditemukan.</td>
                    </tr>
                  ) : (
                    filteredODPs.map((o) => {
                      const percent = Math.round((o.occupied / o.capacity) * 100);
                      return (
                        <tr key={o.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-white">{o.name}</span>
                              <span className="text-[9px] text-slate-500 font-mono tracking-tighter">{o.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-[10px] font-bold uppercase border border-slate-700">
                              {o.parent}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-48">
                              <div className="flex justify-between text-[10px] mb-1 font-bold">
                                <span className={percent > 90 ? "text-rose-400" : "text-slate-400"}>{o.occupied} / {o.capacity} Port</span>
                                <span className={percent > 90 ? "text-rose-400" : "text-slate-400"}>{percent}%</span>
                              </div>
                              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    percent > 90 ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" : percent > 50 ? "bg-amber-500" : "bg-blue-500"
                                  }`} 
                                  style={{ width: `${percent}%` }} 
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <Users className="w-3.5 h-3.5" /> {o.active}
                              </span>
                              <span className="text-[10px] text-slate-500 italic">Pelanggan Aktif</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white font-black">{formatIDR(o.roi)}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => {
                                if (o.lat && o.lng) {
                                  handleViewOnMap(o.lat, o.lng);
                                } else {
                                  toast.error("ODP ini belum memiliki koordinat");
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                            >
                              <MapIcon className="w-3.5 h-3.5" /> Lihat di Peta
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddNodeModal 
          onClose={() => setShowAddModal(false)} 
          olts={data.olts || []}
          odcs={data.odcs || []}
          converters={allConverters}
          odps={data.allODPs || []}
          initialCoords={mapCenter}
        />
      )}
    </div>
  );
}
