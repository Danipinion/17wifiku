"use client";

import { GenieACSDevice } from "@/lib/genieacs";
import {
  Cpu,
  Link as LinkIcon,
  Link2Off,
  RefreshCw,
  Signal,
  Thermometer,
  Clock,
  RotateCcw,
  ShieldCheck,
  Wifi,
  Monitor,
  Edit,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type LinkedDeviceWithData = {
  id: string;
  deviceId: string;
  name: string | null;
  genieacsData: GenieACSDevice | null;
};

interface DeviceAssociationProps {
  userId: string;
  linkedDevices: LinkedDeviceWithData[];
  unlinkedDevices: GenieACSDevice[];
  linkAction: (
    userId: string,
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  unlinkAction: (
    userId: string,
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  renameAction: (
    deviceId: string,
    newName: string,
  ) => Promise<{ success?: string; error?: string }>;
  rebootAction: (
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  refreshAction: (
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  changePasswordAction: (
    deviceId: string,
    passwordBaru: string,
  ) => Promise<{ success?: string; error?: string }>;
}

export function DeviceAssociation({
  userId,
  linkedDevices,
  unlinkedDevices,
  linkAction,
  unlinkAction,
  renameAction,
  rebootAction,
  refreshAction,
  changePasswordAction,
}: DeviceAssociationProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedUnlinkedId, setSelectedUnlinkedId] = useState("");
  const [activeDeviceId, setActiveDeviceId] = useState(
    linkedDevices[0]?.deviceId || "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState("");

  const handleLink = () => {
    if (!selectedUnlinkedId) return;
    startTransition(async () => {
      const result = await linkAction(userId, selectedUnlinkedId);
      if (result.success) {
        toast.success(result.success);
        setSelectedUnlinkedId("");
        if (!activeDeviceId) setActiveDeviceId(selectedUnlinkedId);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleUnlink = (deviceId: string) => {
    if (!confirm("Apakah Anda yakin ingin melepas perangkat ini?")) return;
    startTransition(async () => {
      const result = await unlinkAction(userId, deviceId);
      if (result.success) {
        toast.success(result.success);
        if (activeDeviceId === deviceId) {
          const remaining = linkedDevices.filter(
            (d) => d.deviceId !== deviceId,
          );
          setActiveDeviceId(remaining[0]?.deviceId || "");
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRename = (deviceId: string) => {
    if (!tempName.trim()) return;
    startTransition(async () => {
      const result = await renameAction(deviceId, tempName);
      if (result.success) {
        toast.success(result.success);
        setIsRenaming(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const activeDevice = linkedDevices.find((d) => d.deviceId === activeDeviceId);
  const activeGenieacsData = activeDevice?.genieacsData;

  const handleRefresh = () => {
    if (!activeDeviceId) return;
    startTransition(async () => {
      const result = await refreshAction(activeDeviceId);
      if (result.success) toast.success(result.success);
      else toast.error(result.error);
    });
  };

  const handleReboot = () => {
    if (!activeDeviceId || !confirm("Reboot router sekarang?")) return;
    startTransition(async () => {
      const result = await rebootAction(activeDeviceId);
      if (result.success) toast.success(result.success);
      else toast.error(result.error);
    });
  };

  const handleChangePassword = () => {
    if (!activeDeviceId || newPassword.length < 8) return;
    startTransition(async () => {
      const result = await changePasswordAction(activeDeviceId, newPassword);
      if (result.success) {
        toast.success(result.success);
        setNewPassword("");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (linkedDevices.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl p-10 text-center space-y-6">
        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto text-cyan-400 border border-cyan-500/20">
          <Cpu size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white">Belum Ada Perangkat</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Pelanggan ini belum memiliki router yang terhubung dengan sistem
            GenieACS.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <select
            value={selectedUnlinkedId}
            onChange={(e) => setSelectedUnlinkedId(e.target.value)}
            className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none"
          >
            <option value="">Pilih ID Perangkat...</option>
            {unlinkedDevices.map((dev) => (
              <option key={dev._id} value={dev._id}>
                {dev._id} ({dev._deviceId?._ProductClass || "Unknown"})
              </option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={isPending || !selectedUnlinkedId}
            className="w-full sm:w-auto px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-black transition-all disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <LinkIcon size={16} />
            )}
            HUBUNGKAN
          </button>
        </div>
      </div>
    );
  }

  // Data processing for the active device
  const rxPower =
    activeGenieacsData?.VirtualParameters?.RXPower?._value ||
    activeGenieacsData?.VirtualParameters?.RXpower?._value ||
    "N/A";
  const temp =
    activeGenieacsData?.VirtualParameters?.gettemp?._value ||
    activeGenieacsData?.VirtualParameters?.GetTemp?._value ||
    "N/A";
  const uptime =
    activeGenieacsData?.VirtualParameters?.getdeviceuptime?._value ||
    activeGenieacsData?.VirtualParameters?.GetUptime?._value ||
    "N/A";
  const productClass =
    activeGenieacsData?._deviceId?._ProductClass ||
    activeGenieacsData?.DeviceID?.ProductClass?._value ||
    "Unknown Device";
  const ipAddress =
    activeGenieacsData?.VirtualParameters?.pppoeIP?._value ||
    activeGenieacsData?.VirtualParameters?.IPTR069?._value ||
    "N/A";
  const ssid =
    (activeGenieacsData as any)?.InternetGatewayDevice?.LANDevice?.[1]
      ?.WLANConfiguration?.[1]?.SSID?._value ||
    (activeGenieacsData as any)?.InternetGatewayDevice?.WLANConfiguration?.[1]
      ?.SSID?._value ||
    "N/A";

  const hostsRaw =
    (activeGenieacsData as any)?.InternetGatewayDevice?.LANDevice?.[1]?.Hosts
      ?.Host || {};
  const connectedDevices = Object.values(hostsRaw).filter(
    (d: any) => d.MACAddress?._value,
  );

  const rxPowerVal = parseFloat(rxPower);
  const isSignalBad = rxPowerVal < -27;
  const isSignalWarning = rxPowerVal < -24 && rxPowerVal >= -27;

  return (
    <div className="space-y-6 pb-10">
      {/* DEVICE SELECTOR TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/50 backdrop-blur-md">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 block w-full mb-2">
          Linked Routers
        </label>
        {linkedDevices.map((dev) => (
          <button
            key={dev.deviceId}
            onClick={() => {
              setActiveDeviceId(dev.deviceId);
              setIsRenaming(false);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border flex items-center gap-2 group ${
              activeDeviceId === dev.deviceId
                ? "bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                : "bg-slate-950/60 border-slate-800/50 text-slate-500 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${activeDeviceId === dev.deviceId ? "bg-white animate-pulse" : "bg-slate-700"}`}
            ></div>
            {dev.name || dev.deviceId}
          </button>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={selectedUnlinkedId}
            onChange={(e) => setSelectedUnlinkedId(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:ring-1 focus:ring-cyan-500/30"
          >
            <option value="">+ Link Router Lain</option>
            {unlinkedDevices.map((dev) => (
              <option key={dev._id} value={dev._id}>
                {dev._id.substring(0, 15)}...
              </option>
            ))}
          </select>
          <button
            onClick={handleLink}
            disabled={isPending || !selectedUnlinkedId}
            className="p-2 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white rounded-lg border border-cyan-500/20 disabled:opacity-10 transition-all"
          >
            <LinkIcon size={14} />
          </button>
        </div>
      </div>

      {activeDevice && (
        <div
          key={activeDeviceId}
          className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500"
        >
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/50 p-5 rounded-3xl backdrop-blur-sm shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30 shadow-inner">
                <Cpu className="text-cyan-400" size={28} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {isRenaming ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        defaultValue={activeDevice.name || ""}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Nama Router (mis: Ruang Tamu)"
                        className="bg-slate-950 border border-cyan-500/50 rounded-lg px-3 py-1 text-sm text-white outline-none ring-2 ring-cyan-500/10"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(activeDevice.deviceId)}
                        className="p-1.5 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20"
                      >
                        <ShieldCheck size={16} />
                      </button>
                      <button
                        onClick={() => setIsRenaming(false)}
                        className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20"
                      >
                        <Link2Off size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 group cursor-pointer"
                      onClick={() => {
                        setIsRenaming(true);
                        setTempName(activeDevice.name || "");
                      }}
                    >
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {activeDevice.name || productClass}
                      </h3>
                      <Edit
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500"
                      />
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-bold text-green-400 uppercase tracking-widest">
                        CONNECTED
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">
                    {activeDeviceId}
                  </span>
                  <span className="text-[10px] text-slate-700">•</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    {productClass}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={handleRefresh}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-slate-400 hover:text-white bg-slate-800/50 rounded-xl border border-slate-700/50 transition-all hover:bg-slate-700 disabled:opacity-50 group shadow-lg"
              >
                <RefreshCw
                  size={14}
                  className={`${isPending ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
                />
                SYNC DATA
              </button>
              <button
                onClick={() => handleUnlink(activeDeviceId)}
                disabled={isPending}
                className="px-5 py-2.5 text-xs font-black text-red-400 hover:text-red-300 bg-red-500/5 rounded-xl border border-red-500/20 transition-all hover:bg-red-500/10 shadow-lg"
              >
                UNLINK
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Signal size={18} />
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Power Level
                </span>
              </div>
              <div className="flex items-end gap-1 mb-2">
                <span
                  className={`text-3xl font-black tracking-tighter ${isSignalBad ? "text-red-400" : isSignalWarning ? "text-yellow-400" : "text-green-400"}`}
                >
                  {rxPowerVal || 0}
                </span>
                <span className="text-xs font-bold text-slate-500 mb-1.5 uppercase">
                  dBm
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${isSignalBad ? "bg-red-500" : isSignalWarning ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (rxPowerVal + 40) * 2))}%`,
                  }}
                />
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                  <Thermometer size={18} />
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Temperature
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black tracking-tighter text-orange-400">
                  {temp}
                </span>
                <span className="text-xs font-bold text-slate-500 mb-1.5 uppercase">
                  °C
                </span>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Clock size={18} />
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Uptime
                </span>
              </div>
              <div className="text-xl font-black tracking-tight text-blue-400">
                {uptime}
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <LinkIcon size={18} />
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  Management IP
                </span>
              </div>
              {ipAddress !== "N/A" ? (
                <a
                  href={`http://${ipAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-bold tracking-tight text-purple-400 font-mono hover:text-purple-300 hover:underline underline-offset-4 transition-all"
                >
                  {ipAddress}
                </a>
              ) : (
                <div className="text-base font-bold tracking-tight text-purple-400 font-mono">
                  {ipAddress}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <Wifi size={18} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    WiFi Setting
                  </h4>
                </div>
                <div className="p-6 space-y-6">
                  <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-1 shadow-inner">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Current SSID
                    </span>
                    <p className="text-sm font-bold text-white truncate">
                      {ssid}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        Change Password
                      </label>
                      <span
                        className={`text-[10px] font-bold ${newPassword.length >= 8 ? "text-green-400" : "text-slate-600"}`}
                      >
                        {newPassword.length}/8
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-cyan-500/30 transition-all outline-none"
                        placeholder="Minimal 8 karakter..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        onClick={handleChangePassword}
                        disabled={isPending || newPassword.length < 8}
                        className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3.5 rounded-xl text-xs font-black disabled:opacity-20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 active:scale-95"
                      >
                        {isPending ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        SAVE CHANGES
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
                <div className="p-6 border-b border-slate-800/50 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                    <RotateCcw size={18} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Device Power
                  </h4>
                </div>
                <div className="p-6">
                  <button
                    onClick={handleReboot}
                    disabled={isPending}
                    className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md active:shadow-inner"
                  >
                    <RotateCcw size={14} />
                    REBOOT ROUTER
                  </button>
                  <p className="text-[10px] text-slate-600 mt-4 text-center px-4">
                    Tindakan ini akan memutus semua koneksi selama ±2 menit.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl flex flex-col">
              <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                    <Monitor size={18} />
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Active Clients
                  </h4>
                </div>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-black rounded-full border border-green-500/20">
                  {connectedDevices.length} Connected
                </span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px] p-6 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connectedDevices.map((device: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-slate-950/40 border border-slate-800/50 p-4 rounded-2xl space-y-4 hover:border-cyan-500/20 transition-all hover:bg-slate-950/60 shadow-sm border-l-4 border-l-cyan-500/20"
                    >
                      <div className="flex items-center gap-3 border-b border-slate-800/50 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors shadow-inner">
                          <Monitor size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-slate-200 truncate">
                            {device.HostName?._value || "Unknown"}
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
                            LOCAL NETWORK
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/50">
                          <span className="text-[9px] font-black text-slate-700 uppercase">
                            IP ADDR
                          </span>
                          <span className="text-[11px] text-cyan-400/80 font-mono font-bold tracking-tighter">
                            {device.IPAddress?._value || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800/50">
                          <span className="text-[9px] font-black text-slate-700 uppercase">
                            MAC ADDR
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono tracking-tighter">
                            {device.MACAddress?._value || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {connectedDevices.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-30 select-none">
                      <Wifi
                        size={48}
                        className="mx-auto mb-4 text-slate-700 animate-pulse"
                      />
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em]">
                        No Active Clients
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-950/40 border-t border-slate-800/50">
                <p className="text-[9px] text-slate-700 text-center uppercase font-black tracking-[0.3em]">
                  Hardware ID: {activeDeviceId}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
