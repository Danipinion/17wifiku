"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  ScaleControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Inject custom CSS to theme Leaflet components
const customLeafletStyles = `
  .leaflet-popup-content-wrapper, .leaflet-popup-tip {
    background-color: #0f172a !important;
    color: white !important;
    border: 1px solid #1e293b;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
  }
  .leaflet-container a.leaflet-popup-close-button {
    color: #64748b !important;
    padding: 8px 8px 0 0 !important;
  }
  .leaflet-container a.leaflet-popup-close-button:hover {
    color: white !important;
  }
  @keyframes flow-pulse {
    from {
      stroke-dashoffset: 60;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  .pulse-line {
    animation: flow-pulse 3s linear infinite;
    stroke-dasharray: 10, 50; /* Perfect tiling: 10 + 50 = 60 offset loop */
    stroke-linecap: round;
  }

  /* Deterministic Randomization classes */
  .p-delay-0 { animation-delay: -0.5s; animation-duration: 2.2s; }
  .p-delay-1 { animation-delay: -1.2s; animation-duration: 3.5s; }
  .p-delay-2 { animation-delay: -0.8s; animation-duration: 2.8s; }
  .p-delay-3 { animation-delay: -2.1s; animation-duration: 4.1s; }
  .p-delay-4 { animation-delay: -1.5s; animation-duration: 2.5s; }
  .p-delay-5 { animation-delay: -0.3s; animation-duration: 3.2s; }
  .p-delay-6 { animation-delay: -1.9s; animation-duration: 3.8s; }
  .p-delay-7 { animation-delay: -0.7s; animation-duration: 2.4s; }
  .p-delay-8 { animation-delay: -2.5s; animation-duration: 4.5s; }
  .p-delay-9 { animation-delay: -1.1s; animation-duration: 3.0s; }
`;

import {
  updateNodeLocation,
  updateCustomerLocation,
  assignUserToODP,
  assignUserToConverter,
  assignODPToParentODP,
  assignODCConnection,
  deleteOLT,
  deleteODC,
  deleteConverter,
  deleteODP,
} from "../network-actions";
import { toast } from "sonner";
import {
  Router,
  Users,
  Box,
  Network,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";

// Fix for default Leaflet icon
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">${iconHtml}</div>`,
    className: "custom-div-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const icons = {
  OLT: createCustomIcon(
    "#a855f7",
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
  ),
  ODC: createCustomIcon(
    "#3b82f6",
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 16V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12"/><path d="M2 22h20"/><path d="M16 8v8"/><path d="M8 8v8"/><path d="M12 8v8"/></svg>',
  ),
  Converter: createCustomIcon(
    "#10b981",
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/></svg>',
  ),
  ODP: createCustomIcon(
    "#eab308",
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>',
  ),
  User: (status: string) => {
    const icon = createCustomIcon(
      status === "ACTIVE" ? "#34d399" : "#f87171",
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    );
    icon.options.iconAnchor = [16, 16];
    return icon;
  },
};

// --- LEAFLET HELPER COMPONENTS ---

const FlyTo = ({
  target,
}: {
  target?: { lat: number; lng: number; id: string } | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (target && !isNaN(target.lat) && !isNaN(target.lng)) {
      map.flyTo([target.lat, target.lng], 17, { duration: 1.5 });
    }
  }, [target, map]);
  return null;
};

const CenterTracker = ({
  onCenterChange,
}: {
  onCenterChange?: (c: { lat: number; lng: number }) => void;
}) => {
  const map = useMap();
  useEffect(() => {
    const report = () => {
      const c = map.getCenter();
      onCenterChange?.({ lat: c.lat, lng: c.lng });
    };
    map.on("moveend", report);
    return () => {
      map.off("moveend", report);
    };
  }, [map, onCenterChange]);
  return null;
};

const MapResizer = ({ isFullscreen }: { isFullscreen: boolean }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 600);
  }, [isFullscreen, map]);
  return null;
};

// --- MAIN COMPONENT ---

interface NetworkMapProps {
  data: any;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  forceCenter?: { lat: number; lng: number; id: string } | null;
}

export default function NetworkMap({
  data,
  onCenterChange,
  forceCenter,
}: NetworkMapProps) {
  const [center] = useState<[number, number]>([
    -7.685696285902106, 111.60228212949397,
  ]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [localLocations, setLocalLocations] = useState<
    Record<string, [number, number]>
  >({});
  const [localAssignments, setLocalAssignments] = useState<
    Record<string, { odpId?: string | null; converterId?: string | null }>
  >({});
  const router = useRouter();

  const memoIcons = useMemo(
    () => ({
      OLT: icons.OLT,
      ODC: icons.ODC,
      Converter: icons.Converter,
      ODP: icons.ODP,
      UserActive: icons.User("ACTIVE"),
      UserInactive: icons.User("INACTIVE"),
    }),
    [],
  );

  const madiunBounds: L.LatLngBoundsExpression = [
    [-7.85, 111.45],
    [-7.45, 111.85],
  ];

  useEffect(() => {
    setIsLoaded(true);
    const style = document.createElement("style");
    style.innerHTML = customLeafletStyles;
    document.head.appendChild(style);

    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    const el = document.getElementById("network-map-container");
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch((err) =>
        toast.error(`Fullscreen error: ${err.message}`),
      );
    } else {
      document.exitFullscreen();
    }
  };

  const handleDrag = (type: any, id: string, e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setLocalLocations((prev) => ({ ...prev, [`${type}-${id}`]: [lat, lng] }));
  };

  const handleDragEnd = async (type: any, id: string, e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setLocalLocations((prev) => ({ ...prev, [`${type}-${id}`]: [lat, lng] }));
    if (type === "User") await updateCustomerLocation(id, lat, lng);
    else await updateNodeLocation(type, id, lat, lng);
    router.refresh();
  };

  const getPos = (
    type: string,
    id: string,
    defaultLat: number,
    defaultLng: number,
  ): [number, number] => {
    return localLocations[`${type}-${id}`] || [defaultLat, defaultLng];
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const isCircular = (odpId: string, potentialParentId: string): boolean => {
    if (odpId === potentialParentId) return true;
    let currentId = potentialParentId;
    const maxDepth = 20;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      const parent = data.allODPs?.find((o: any) => o.id === currentId);
      if (!parent) break;
      if (parent.parentOdpId === odpId) return true;
      currentId = parent.parentOdpId;
      depth++;
    }
    return false;
  };

  if (!isLoaded)
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-slate-900 animate-pulse rounded-2xl">
        Loading Map...
      </div>
    );

  return (
    <div
      id="network-map-container"
      className={`relative w-full overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group/map transition-all duration-500 ${isFullscreen ? "h-screen rounded-none" : "h-[calc(100vh-250px)] rounded-2xl"}`}
    >
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setShowLegend(!showLegend)}
          className={`p-2.5 backdrop-blur-md rounded-xl border border-slate-800 text-white shadow-xl transition-all ${showLegend ? "bg-blue-600 border-blue-500" : "bg-slate-900/80 hover:bg-slate-800"}`}
          title="Toggle Legend"
        >
          <Network size={20} />
        </button>
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-2.5 backdrop-blur-md rounded-xl border border-slate-800 text-white shadow-xl transition-all ${isLocked ? "bg-slate-900/80 hover:bg-slate-800" : "bg-rose-600 border-rose-500 animate-pulse"}`}
          title={isLocked ? "Unlock Nodes" : "Lock Nodes"}
        >
          {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
        </button>
      </div>

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2.5 bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-800 text-white shadow-xl hover:bg-slate-800 transition-all font-bold"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        minZoom={11}
        maxBounds={madiunBounds}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ScaleControl position="bottomleft" />
        <CenterTracker onCenterChange={onCenterChange} />
        <FlyTo target={forceCenter} />
        <MapResizer isFullscreen={isFullscreen} />

        {data.olts?.map((olt: any) => (
          <div key={olt.id}>
            {olt.latitude && olt.longitude && (
              <Marker
                position={getPos("OLT", olt.id, olt.latitude, olt.longitude)}
                icon={memoIcons.OLT}
                draggable={!isLocked}
                eventHandlers={{
                  drag: (e) => handleDrag("OLT", olt.id, e),
                  dragend: (e) => handleDragEnd("OLT", olt.id, e),
                }}
              >
                <Popup>
                  <div className="p-4 bg-slate-900 min-w-[220px] rounded-xl">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Network className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white leading-tight">
                            OLT: {olt.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                            {olt.id}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Hapus OLT ${olt.name}?`)) {
                            const res = await deleteOLT(olt.id);
                            if (res.success) toast.success("OLT dihapus");
                            else toast.error(res.error);
                            router.refresh();
                          }
                        }}
                        className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </div>
        ))}

        {data.odcs?.map((odc: any) => {
          let parentPos: [number, number] | null = null;
          let parentName = "Main Central";
          if (odc.oltId) {
            const olt = data.olts?.find((o: any) => o.id === odc.oltId);
            if (olt?.latitude) {
              parentPos = getPos("OLT", olt.id, olt.latitude, olt.longitude);
              parentName = `OLT: ${olt.name}`;
            }
          } else if (odc.parentOdcId) {
            const pOdc = data.odcs?.find((o: any) => o.id === odc.parentOdcId);
            if (pOdc?.latitude) {
              parentPos = getPos("ODC", pOdc.id, pOdc.latitude, pOdc.longitude);
              parentName = `ODC: ${pOdc.name}`;
            }
          } else if (odc.parentOdpId) {
            const pOdp = data.allODPs?.find(
              (o: any) => o.id === odc.parentOdpId,
            );
            if (pOdp?.latitude) {
              parentPos = getPos("ODP", pOdp.id, pOdp.latitude, pOdp.longitude);
              parentName = `ODP: ${pOdp.name}`;
            }
          }

          return (
            <div key={odc.id}>
              {odc.latitude && odc.longitude && (
                <Marker
                  position={getPos("ODC", odc.id, odc.latitude, odc.longitude)}
                  icon={memoIcons.ODC}
                  draggable={!isLocked}
                  eventHandlers={{
                    drag: (e) => handleDrag("ODC", odc.id, e),
                    dragend: (e) => handleDragEnd("ODC", odc.id, e),
                  }}
                >
                  <Popup>
                    <div className="p-4 bg-slate-900 min-w-[220px] rounded-xl">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Network className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white leading-tight">
                              ODC: {odc.name}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">
                              {odc.id}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Hapus ODC ${odc.name}?`)) {
                              const res = await deleteODC(odc.id);
                              if (res.success) toast.success("ODC dihapus");
                              else toast.error(res.error);
                              router.refresh();
                            }
                          }}
                          className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="col-span-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 text-center mb-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none block">
                            Induk: {parentName}
                          </span>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 text-center">
                          <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                            ODP
                          </p>
                          <p className="text-sm font-black text-white">
                            {odc.odps?.length || 0}
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50 text-center">
                          <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                            Converter
                          </p>
                          <p className="text-sm font-black text-white">
                            {odc.converters.length}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 mt-2 border-t border-slate-800">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                          Set Induk ODC:
                        </label>
                        <select
                          className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 p-2.5 rounded-xl text-[10px] font-black text-white outline-none transition-all"
                          value={
                            odc.oltId
                              ? `OLT:${odc.oltId}`
                              : odc.parentOdcId
                                ? `ODC:${odc.parentOdcId}`
                                : odc.parentOdpId
                                  ? `ODP:${odc.parentOdpId}`
                                  : ""
                          }
                          onChange={async (e) => {
                            const v = e.target.value;
                            const [pType, pId] = v
                              ? v.split(":")
                              : [null, null];
                            await assignODCConnection(
                              odc.id,
                              pType as any,
                              pId,
                            );
                            router.refresh();
                          }}
                        >
                          <option value="">-- TANPA INDUK --</option>
                          <optgroup label="OLT">
                            {data.olts?.map((o: any) => (
                              <option key={o.id} value={`OLT:${o.id}`}>
                                {o.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="ODC">
                            {data.odcs
                              ?.filter((o: any) => o.id !== odc.id)
                              .map((o: any) => (
                                <option key={o.id} value={`ODC:${o.id}`}>
                                  {o.name}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="ODP">
                            {data.allODPs
                              ?.filter((o: any) => o.id !== odc.parentOdpId)
                              .map((o: any) => (
                                <option key={o.id} value={`ODP:${o.id}`}>
                                  {o.name}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {parentPos && odc.latitude && (
                <>
                  <Polyline
                    positions={[
                      parentPos,
                      getPos("ODC", odc.id, odc.latitude, odc.longitude),
                    ]}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.3}
                    interactive={false}
                  />
                  <Polyline
                    positions={[
                      parentPos,
                      getPos("ODC", odc.id, odc.latitude, odc.longitude),
                    ]}
                    color="#ffffff"
                    weight={2}
                    opacity={0.6}
                    className={`pulse-line p-delay-${String(odc.id).length % 10}`}
                    interactive={false}
                  />
                </>
              )}

              {odc.converters?.map((conv: any) => {
                let convParentPos: [number, number] | null = null;
                if (conv.oltId) {
                  const olt = data.olts?.find((o: any) => o.id === conv.oltId);
                  if (olt?.latitude)
                    convParentPos = getPos(
                      "OLT",
                      olt.id,
                      olt.latitude,
                      olt.longitude,
                    );
                } else if (conv.odcId) {
                  const pOdc = data.odcs?.find((o: any) => o.id === conv.odcId);
                  if (pOdc?.latitude)
                    convParentPos = getPos(
                      "ODC",
                      pOdc.id,
                      pOdc.latitude,
                      pOdc.longitude,
                    );
                }

                return (
                  <div key={conv.id}>
                    {conv.latitude && conv.longitude && (
                      <>
                        <Marker
                          position={getPos(
                            "Converter",
                            conv.id,
                            conv.latitude,
                            conv.longitude,
                          )}
                          icon={memoIcons.Converter}
                          draggable={!isLocked}
                          eventHandlers={{
                            drag: (e) => handleDrag("Converter", conv.id, e),
                            dragend: (e) =>
                              handleDragEnd("Converter", conv.id, e),
                          }}
                        >
                          <Popup>
                            <div className="p-4 bg-slate-900 min-w-[200px] rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                                    <Box className="w-5 h-5 text-emerald-500" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white leading-tight">
                                      Converter: {conv.name}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 italic">
                                      ODC: {odc.name}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    if (
                                      window.confirm(
                                        `Hapus Converter ${conv.name}?`,
                                      )
                                    ) {
                                      const res = await deleteConverter(
                                        conv.id,
                                      );
                                      if (res.success)
                                        toast.success("Converter dihapus");
                                      else toast.error(res.error);
                                      router.refresh();
                                    }
                                  }}
                                  className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                  ODP Aktif
                                </span>
                                <span className="text-emerald-400 font-black">
                                  {conv.odps.length}
                                </span>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                        {convParentPos && (
                          <>
                            <Polyline
                              positions={[
                                convParentPos,
                                getPos(
                                  "Converter",
                                  conv.id,
                                  conv.latitude,
                                  conv.longitude,
                                ),
                              ]}
                              color="#10b981"
                              weight={3}
                              opacity={0.3}
                              interactive={false}
                            />
                            <Polyline
                              positions={[
                                convParentPos,
                                getPos(
                                  "Converter",
                                  conv.id,
                                  conv.latitude,
                                  conv.longitude,
                                ),
                              ]}
                              color="#ffffff"
                              weight={2}
                              opacity={0.6}
                              className={`pulse-line p-delay-${String(conv.id).length % 10}`}
                              interactive={false}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {data.allODPs?.map((odp: any) => {
          if (!odp.latitude || !odp.longitude) return null;
          const pos = getPos("ODP", odp.id, odp.latitude, odp.longitude);
          let parentPos: [number, number] | null = null;
          let parentName = "Main Distribution";
          const childOdps = data.allODPs.filter(
            (o: any) => o.parentOdpId === odp.id,
          );
          const totalOccupied = odp.users.length + childOdps.length;

          if (odp.oltId) {
            const olt = data.olts?.find((o: any) => o.id === odp.oltId);
            if (olt?.latitude) {
              parentPos = getPos("OLT", olt.id, olt.latitude, olt.longitude);
              parentName = `OLT: ${olt.name}`;
            }
          } else if (odp.parentOdpId) {
            const p = data.allODPs.find((o: any) => o.id === odp.parentOdpId);
            if (p?.latitude) {
              parentPos = getPos("ODP", p.id, p.latitude, p.longitude);
              parentName = `Cascading: ${p.name}`;
            }
          } else if (odp.converterId) {
            const conv = data.odcs
              .flatMap((o: any) => o.converters)
              .find((c: any) => c.id === odp.converterId);
            if (conv?.latitude) {
              parentPos = getPos(
                "Converter",
                conv.id,
                conv.latitude,
                conv.longitude,
              );
              parentName = `Conv: ${conv.name}`;
            }
          } else if (odp.odcId) {
            const odc = data.odcs.find((o: any) => o.id === odp.odcId);
            if (odc?.latitude) {
              parentPos = getPos("ODC", odc.id, odc.latitude, odc.longitude);
              parentName = `ODC: ${odc.name}`;
            }
          }

          return (
            <div key={`odp-group-${odp.id}`}>
              <Marker
                position={pos}
                icon={memoIcons.ODP}
                draggable={!isLocked}
                eventHandlers={{
                  drag: (e) => handleDrag("ODP", odp.id, e),
                  dragend: (e) => handleDragEnd("ODP", odp.id, e),
                }}
              >
                <Popup>
                  <div className="p-4 bg-slate-900 min-w-[260px] rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-500">
                          <Router size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-sm">
                            ODP: {odp.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                            {parentName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Hapus ODP ${odp.name}?`)) {
                            const res = await deleteODP(odp.id);
                            if (res.success) toast.success("ODP dihapus");
                            else toast.error(res.error);
                            router.refresh();
                          }
                        }}
                        className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/50">
                          <p className="text-[8px] text-slate-500 font-bold uppercase text-center mb-1">
                            Direct Users
                          </p>
                          <p className="text-xs font-black text-center text-white">
                            {odp.users.length}
                          </p>
                        </div>
                        <div className="bg-slate-800/40 p-2 rounded-xl border border-slate-700/50">
                          <p className="text-[8px] text-slate-500 font-bold uppercase text-center mb-1">
                            Child ODPs
                          </p>
                          <p className="text-xs font-black text-center text-amber-500">
                            {childOdps.length}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-1.5">
                          <span className="text-slate-400">
                            Total Port Occupied
                          </span>
                          <span
                            className={`${totalOccupied >= odp.capacity ? "text-rose-500" : "text-white"}`}
                          >
                            {totalOccupied} / {odp.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${totalOccupied >= odp.capacity ? "bg-rose-500" : "bg-amber-500"}`}
                            style={{
                              width: `${Math.min(100, (totalOccupied / odp.capacity) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">
                          Set Induk ODP:
                        </label>
                        <select
                          className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500 p-2.5 rounded-xl text-[10px] font-black text-white outline-none transition-all"
                          value={
                            odp.oltId
                              ? `OLT:${odp.oltId}`
                              : odp.odcId
                                ? `ODC:${odp.odcId}`
                                : odp.converterId
                                  ? `CONV:${odp.converterId}`
                                  : odp.parentOdpId
                                    ? `ODP:${odp.parentOdpId}`
                                    : ""
                          }
                          onChange={async (e) => {
                            const v = e.target.value;
                            const [pType, pId] = v
                              ? v.split(":")
                              : [null, null];
                            if (
                              pType === "ODP" &&
                              pId &&
                              isCircular(odp.id, pId)
                            ) {
                              toast.error("Gagal: Circular Link!");
                              return;
                            }
                            await assignODPToParentODP(
                              odp.id,
                              pType as any,
                              pId,
                            );
                            router.refresh();
                          }}
                        >
                          <option value="">-- TANPA INDUK --</option>
                          <optgroup label="OLT">
                            {data.olts?.map((o: any) => (
                              <option key={o.id} value={`OLT:${o.id}`}>
                                {o.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="ODC">
                            {data.odcs?.map((o: any) => (
                              <option key={o.id} value={`ODC:${o.id}`}>
                                {o.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="CONVERTER">
                            {data.odcs
                              ?.flatMap((o: any) => o.converters)
                              .map((c: any) => (
                                <option key={c.id} value={`CONV:${c.id}`}>
                                  {c.name}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="ODP">
                            {data.allODPs
                              ?.filter(
                                (o: any) =>
                                  o.id !== odp.id && !isCircular(odp.id, o.id),
                              )
                              .map((o: any) => (
                                <option key={o.id} value={`ODP:${o.id}`}>
                                  {o.name}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
              {parentPos && (
                <>
                  <Polyline
                    positions={[parentPos, pos]}
                    color="#f59e0b"
                    weight={2}
                    opacity={0.3}
                    interactive={false}
                  />
                  <Polyline
                    positions={[parentPos, pos]}
                    color="#ffffff"
                    weight={1}
                    opacity={0.6}
                    className={`pulse-line p-delay-${String(odp.id).length % 10}`}
                    interactive={false}
                  />
                </>
              )}
            </div>
          );
        })}

        {(() => {
          const allUsers = [
            ...(data.allODPs?.flatMap((o: any) =>
              o.users.map((u: any) => ({ ...u, parentODP: o })),
            ) || []),
            ...(data.standaloneUsers || []),
          ];
          const nodeLocations: Record<string, [number, number]> = {};
          data.odcs?.forEach((odc: any) => {
            if (odc.latitude)
              nodeLocations[`ODC-${odc.id}`] = getPos(
                "ODC",
                odc.id,
                odc.latitude,
                odc.longitude,
              );
            odc.converters?.forEach((c: any) => {
              if (c.latitude)
                nodeLocations[`CONV-${c.id}`] = getPos(
                  "Converter",
                  c.id,
                  c.latitude,
                  c.longitude,
                );
            });
          });
          data.allODPs?.forEach((o: any) => {
            if (o.latitude)
              nodeLocations[`ODP-${o.id}`] = getPos(
                "ODP",
                o.id,
                o.latitude,
                o.longitude,
              );
          });

          // Helper for jittered center (deterministic based on ID)
          const getSyntheticPos = (id: string): [number, number] => {
            // Simple hash for stable jitter
            let hash = 0;
            for (let i = 0; i < id.length; i++)
              hash = (hash << 5) - hash + id.charCodeAt(i);
            const jitterLat = Math.abs(hash % 1000) / 100000 - 0.005;
            const jitterLng = Math.abs((hash >> 5) % 1000) / 100000 - 0.005;
            return [center[0] + jitterLat, center[1] + jitterLng];
          };

          return allUsers.map((user: any) => {
            const isUnmapped = !user.latitude || !user.longitude;
            const upos = isUnmapped
              ? getPos("User", user.id, ...getSyntheticPos(user.id))
              : getPos("User", user.id, user.latitude, user.longitude);

            const local = localAssignments[user.id];
            const pId = local
              ? local.odpId
                ? `ODP-${local.odpId}`
                : local.converterId
                  ? `CONV-${local.converterId}`
                  : null
              : user.odpId
                ? `ODP-${user.odpId}`
                : user.converterId
                  ? `CONV-${user.converterId}`
                  : null;
            const pPos = pId ? nodeLocations[pId] : null;

            return (
              <div key={`user-group-${user.id}`}>
                <Marker
                  position={upos}
                  icon={
                    user.status === "ACTIVE"
                      ? memoIcons.UserActive
                      : memoIcons.UserInactive
                  }
                  draggable={!isLocked}
                  eventHandlers={{
                    drag: (e) => handleDrag("User", user.id, e),
                    dragend: (e) => handleDragEnd("User", user.id, e),
                  }}
                >
                  <Popup>
                    <div className="p-4 bg-slate-900 min-w-[260px] text-white rounded-2xl">
                      {isUnmapped && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl mb-3 text-center">
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                            ⚠️ Belum Terplot Permanen
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
                        <div
                          className={`p-3 rounded-xl shadow-lg ${user.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                        >
                          <Users size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase tracking-tight">
                            {user.name}
                          </h4>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${user.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}
                          >
                            {user.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-1 text-center">
                            Tagihan
                          </p>
                          <p className="text-[11px] font-black text-center">
                            {user.abonemen ? formatIDR(user.abonemen) : "Rp. 0"}
                          </p>
                        </div>
                        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                          <p className="text-[8px] text-slate-500 font-bold uppercase mb-1 text-center">
                            Hub Type
                          </p>
                          <p className="text-[11px] font-black text-blue-400 text-center uppercase tracking-tighter">
                            {pId?.split("-")[0] || "Unmapped"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Assign ke Terminal:
                        </label>
                        <select
                          className="w-full bg-slate-800 border-2 border-slate-700 focus:border-blue-600 p-2.5 rounded-xl text-xs font-black outline-none transition-all"
                          value={
                            local
                              ? local.odpId
                                ? `ODP:${local.odpId}`
                                : local.converterId
                                  ? `CONV:${local.converterId}`
                                  : ""
                              : user.odpId
                                ? `ODP:${user.odpId}`
                                : user.converterId
                                  ? `CONV:${user.converterId}`
                                  : ""
                          }
                          onChange={async (e) => {
                            const val = e.target.value;
                            const odpId = val.startsWith("ODP:")
                              ? val.split(":")[1]
                              : null;
                            const converterId = val.startsWith("CONV:")
                              ? val.split(":")[1]
                              : null;
                            setLocalAssignments((prev) => ({
                              ...prev,
                              [user.id]: { odpId, converterId },
                            }));
                            if (odpId) await assignUserToODP(user.id, odpId);
                            else if (converterId)
                              await assignUserToConverter(user.id, converterId);
                            else await assignUserToODP(user.id, null);
                            router.refresh();
                          }}
                        >
                          <option value="">-- TANPA HUB --</option>
                          <optgroup label="ODP / BOX" className="bg-slate-900">
                            {data.allODPs.map((o: any) => (
                              <option key={o.id} value={`ODP:${o.id}`}>
                                {o.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup
                            label="SUB-CONVERTER"
                            className="bg-slate-900"
                          >
                            {data.odcs
                              .flatMap((o: any) => o.converters)
                              .map((c: any) => (
                                <option key={c.id} value={`CONV:${c.id}`}>
                                  {c.name}
                                </option>
                              ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                {pPos && (
                  <>
                    <Polyline
                      positions={[pPos, upos]}
                      color={user.status === "ACTIVE" ? "#10b981" : "#f43f5e"}
                      weight={2}
                      opacity={0.2}
                      interactive={false}
                    />
                    <Polyline
                      positions={[pPos, upos]}
                      color="#ffffff"
                      weight={1}
                      opacity={0.5}
                      className={`pulse-line p-delay-${String(user.id).length % 10}`}
                      interactive={false}
                    />
                  </>
                )}
              </div>
            );
          });
        })()}
      </MapContainer>

      {/* Simplified Legend Panel */}
      {showLegend && (
        <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 shadow-2xl min-w-[200px] animate-in fade-in slide-in-from-right-4 duration-500">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
            Legend Hierarchy
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border-2 border-white/20" />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter">
                OLT
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white/20" />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter">
                ODC
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white/20" />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter">
                Converter
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white/20" />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter">
                ODP
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white/30" />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter italic">
                Pel Online
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white/30" />
              <span className="text-[10px] font-black text-slate-100 uppercase tracking-tighter italic">
                Pel Offline
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
