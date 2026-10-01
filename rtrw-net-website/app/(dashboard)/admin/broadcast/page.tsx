"use client";

import { useState, useEffect, useTransition, useRef, ReactNode } from "react";
import {
  Send,
  History,
  Loader2,
  AlertTriangle,
  Megaphone,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Check,
  XCircle,
  Clock,
  Search,
  ChevronRight,
  Info,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  sendCustomBroadcast,
  getBroadcastHistory,
  sendAutomatedReminders,
  getBroadcastDetails,
} from "../actions";

type BroadcastLog = {
  id: string;
  message: string;
  target: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  status: string;
  currentIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

type BroadcastDetail = {
  id: string;
  recipientName: string;
  recipientPhone: string;
  status: string;
  reason: string | null;
  createdAt: Date;
};

export default function BroadcastPage() {
  const [isPending, startTransition] = useTransition();
  const [history, setHistory] = useState<BroadcastLog[]>([]);
  const [target, setTarget] = useState("ALL");
  const [messageText, setMessageText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // States for Detail Modal
  const [selectedLog, setSelectedLog] = useState<BroadcastLog | null>(null);
  const [details, setDetails] = useState<BroadcastDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load History & Polling Logic
  const fetchHistory = async () => {
    const data = await getBroadcastHistory();
    setHistory(data as unknown as BroadcastLog[]);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Polling for processing broadcasts
  useEffect(() => {
    const hasProcessing = history.some((log) => log.status === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchHistory();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [history]);

  const insertFormat = (symbol: string, mode: "wrap" | "block" | "ordered") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText = "";
    let newCursorPos = 0;

    if (mode === "wrap") {
      const before = text.substring(0, start);
      const after = text.substring(end);
      newText = `${before}${symbol}${selectedText}${symbol}${after}`;
      newCursorPos =
        selectedText.length > 0
          ? end + symbol.length * 2
          : start + symbol.length;
    } else if (mode === "block") {
      const before = text.substring(0, start);
      const after = text.substring(end);
      const prefix = start > 0 && text[start - 1] !== "\n" ? "\n- " : "- ";
      newText = `${before}${prefix}${selectedText}${after}`;
      newCursorPos = start + prefix.length + selectedText.length;
    } else if (mode === "ordered") {
      const before = text.substring(0, start);
      const after = text.substring(end);
      const prefix = start > 0 && text[start - 1] !== "\n" ? "\n1. " : "1. ";
      newText = `${before}${prefix}${selectedText}${after}`;
      newCursorPos = start + prefix.length + selectedText.length;
    }

    setMessageText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const value = textarea.value;
      const lastNewline = value.lastIndexOf("\n", start - 1);
      const currentLine = value.substring(lastNewline + 1, start);
      const bulletMatch = currentLine.match(/^-\s/);
      const numberMatch = currentLine.match(/^(\d+)\.\s/);

      if (bulletMatch || numberMatch) {
        e.preventDefault();
        if (
          (bulletMatch && currentLine.trim() === "-") ||
          (numberMatch && currentLine.trim() === `${numberMatch[1]}.`)
        ) {
          const newValue =
            value.substring(0, lastNewline + 1) + value.substring(start);
          setMessageText(newValue);
          setTimeout(
            () => textarea.setSelectionRange(lastNewline + 1, lastNewline + 1),
            0,
          );
          return;
        }
        let insertion = bulletMatch
          ? "\n- "
          : `\n${parseInt(numberMatch![1]) + 1}. `;
        const newValue =
          value.substring(0, start) + insertion + value.substring(start);
        setMessageText(newValue);
        setTimeout(
          () =>
            textarea.setSelectionRange(
              start + insertion.length,
              start + insertion.length,
            ),
          0,
        );
      }
    }
  };

  const renderWhatsAppPreview = (text: string): ReactNode[] => {
    if (!text) return [];
    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
      const parseLine = (str: string): ReactNode => {
        const parts: ReactNode[] = [];
        const boldParts = str.split(/(\*.*?\*)/g);
        return boldParts.map((part, i) => {
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <strong key={i} className="font-bold text-slate-900">
                {part.slice(1, -1)}
              </strong>
            );
          }
          const italicParts = part.split(/(_.*?_)/g);
          return italicParts.map((subPart, j) => {
            if (
              subPart.startsWith("_") &&
              subPart.endsWith("_") &&
              subPart.length > 2
            ) {
              return (
                <em key={`${i}-${j}`} className="italic">
                  {subPart.slice(1, -1)}
                </em>
              );
            }
            const strikeParts = subPart.split(/(~.*?~)/g);
            return strikeParts.map((stPart, k) => {
              if (
                stPart.startsWith("~") &&
                stPart.endsWith("~") &&
                stPart.length > 2
              ) {
                return (
                  <span
                    key={`${i}-${j}-${k}`}
                    className="line-through text-slate-500"
                  >
                    {stPart.slice(1, -1)}
                  </span>
                );
              }
              const codeParts = stPart.split(/(```.*?```)/g);
              return codeParts.map((cPart, l) => {
                if (
                  cPart.startsWith("```") &&
                  cPart.endsWith("```") &&
                  cPart.length > 6
                ) {
                  return (
                    <code
                      key={`${i}-${j}-${k}-${l}`}
                      className="font-mono bg-slate-800 px-1 rounded text-yellow-200 text-xs"
                    >
                      {cPart.slice(3, -3)}
                    </code>
                  );
                }
                return cPart;
              });
            });
          });
        });
      };
      return (
        <div key={lineIndex} className="min-h-[1.5em]">
          {parseLine(line)}
        </div>
      );
    });
  };

  const handleConfirmSend = () => {
    setIsConfirmOpen(false);
    const formData = new FormData();
    formData.append("target", target);
    formData.append("message", messageText);

    startTransition(async () => {
      const result = await sendCustomBroadcast(formData);
      if (result.error) toast.error(result.error);
      else if (result.success) {
        toast.success(result.success);
        setMessageText("");
        fetchHistory();
      }
    });
  };

  const openDetails = async (log: BroadcastLog) => {
    setSelectedLog(log);
    setDetails([]);
    setIsLoadingDetails(true);
    const result = await getBroadcastDetails(log.id);
    if (result.error) {
      toast.error(result.error);
      setSelectedLog(null);
    } else {
      setDetails(result.details as unknown as BroadcastDetail[]);
    }
    setIsLoadingDetails(false);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Megaphone className="text-blue-500" /> Broadcast Pesan
        </h1>
        <button
          onClick={fetchHistory}
          className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
          title="Refresh Riwayat"
        >
          <RefreshCw
            size={20}
            className={
              history.some((l) => l.status === "PROCESSING")
                ? "animate-spin text-blue-500"
                : ""
            }
          />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Kirim Pesan Baru
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsConfirmOpen(true);
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Target Penerima
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="select-style w-full"
              >
                <option value="ALL">Semua Pelanggan</option>
                <option value="ACTIVE">Hanya Pelanggan Aktif</option>
                <option value="INACTIVE">Hanya Pelanggan Non-Aktif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Isi Pesan
              </label>
              <div className="border border-slate-700 rounded-md overflow-hidden bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-700 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => insertFormat("*", "wrap")}
                    className="p-1.5 rounded hover:bg-slate-700 text-gray-300"
                  >
                    <Bold size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat("_", "wrap")}
                    className="p-1.5 rounded hover:bg-slate-700 text-gray-300"
                  >
                    <Italic size={18} />
                  </button>
                  <div className="w-px h-4 bg-slate-700 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => insertFormat("-", "block")}
                    className="p-1.5 rounded hover:bg-slate-700 text-gray-300"
                  >
                    <List size={18} />
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={10}
                  required
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tulis pesan di sini..."
                  className="w-full px-4 py-3 bg-slate-800 text-white border-none focus:ring-0 resize-y"
                ></textarea>
              </div>
              <div className="flex justify-between items-start mt-2 text-[10px] text-slate-500">
                <p>Variabel: [NAMA], [IDPEL], [TAGIHAN], [TANGGAL]</p>
                <p>{messageText.length} karakter</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending || messageText.length < 5}
                className="btn-primary flex items-center gap-2 px-6 w-full sm:w-auto"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
                {isPending ? "Memproses..." : "Kirim Broadcast"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Live Preview</h2>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20 font-bold uppercase tracking-wider">
              Tampilan WhatsApp
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="relative mx-auto w-full max-w-[400px]">
              {/* Visual Phone Mockup Header */}
              <div className="bg-[#075e54] text-white p-3 rounded-t-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-400/30 flex items-center justify-center">
                  <Megaphone size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold leading-none">
                    Broadcast System
                  </p>
                  <p className="text-[10px] text-emerald-200">online</p>
                </div>
              </div>
              {/* Chat Area */}
              <div className="p-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-center rounded-b-2xl border-x border-b border-slate-800 min-h-[300px] shadow-2xl relative">
                <div className="bg-[#dcf8c6] text-slate-800 p-3 rounded-lg rounded-tl-none shadow-sm text-sm relative max-w-[85%] animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="font-sans whitespace-pre-wrap leading-relaxed">
                    {messageText ? (
                      renderWhatsAppPreview(
                        messageText
                          .replace(/\[NAMA\]/g, "Budi Sudarsono")
                          .replace(/\[IDPEL\]/g, "JKT88123")
                          .replace(/\[TAGIHAN\]/g, "Rp 150.000")
                          .replace(
                            /\[TANGGAL\]/g,
                            new Date().toLocaleString("id-ID", {
                              dateStyle: "full",
                            }),
                          ),
                      )
                    ) : (
                      <p className="text-slate-400 italic">
                        Tulis pesan untuk melihat preview...
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 text-right mt-1">
                    {new Date().toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {/* bubble tail */}
                  <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-[#dcf8c6] border-l-[10px] border-l-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 overflow-hidden">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <History size={20} /> Riwayat Broadcast
        </h2>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-slate-800/10 text-gray-200 border-b border-slate-800">
              <tr>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">
                  Tanggal
                </th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">
                  Pesan & Target
                </th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">
                  Statistik Progres
                </th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {history.length > 0 ? (
                history.map((log) => {
                  const progress =
                    log.recipientCount > 0
                      ? (log.currentIndex / log.recipientCount) * 100
                      : 0;
                  const isProcessing = log.status === "PROCESSING";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/20 cursor-pointer transition-colors"
                      onClick={() => openDetails(log)}
                    >
                      <td className="p-4 whitespace-nowrap align-top">
                        <div className="font-medium text-white">
                          {new Date(log.createdAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.target === "ACTIVE"
                                ? "bg-emerald-900/40 text-emerald-400 border border-emerald-500/20"
                                : log.target === "INACTIVE"
                                  ? "bg-red-900/40 text-red-400 border border-red-500/20"
                                  : "bg-blue-900/40 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {log.target}
                          </span>
                        </div>
                        <div className="text-xs line-clamp-2 max-w-xs text-slate-300 font-mono italic">
                          "{log.message}"
                        </div>
                      </td>
                      <td className="p-4 align-top min-w-[200px]">
                        <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-widest text-slate-500">
                          <span>
                            {log.currentIndex} / {log.recipientCount} Pesan
                          </span>
                          <span
                            className={
                              log.failedCount > 0 ? "text-red-400" : ""
                            }
                          >
                            {log.failedCount} Gagal
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isProcessing ? "bg-blue-500 animate-pulse" : "bg-emerald-500"}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex gap-4 mt-2">
                          <div className="flex items-center gap-1 text-emerald-400 text-xs">
                            <Check size={12} /> {log.successCount}
                          </div>
                          {log.failedCount > 0 && (
                            <div className="flex items-center gap-1 text-red-400 text-xs">
                              <XCircle size={12} /> {log.failedCount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center align-top">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            log.status === "COMPLETED"
                              ? "bg-emerald-900/20 text-emerald-400 border-emerald-500/30"
                              : log.status === "PROCESSING"
                                ? "bg-blue-900/20 text-blue-400 border-blue-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {log.status === "PROCESSING" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : null}
                          {log.status}
                        </div>
                        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1">
                          <Info size={10} /> Klik untuk Detail
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    Belum ada riwayat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-800/20">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <Send className="text-blue-500" /> Konfirmasi
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-400">
                Anda akan mengirim broadcast ke{" "}
                <span className="text-white font-bold">{target}</span>
              </p>
              <div className="p-4 bg-black/40 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">
                  WhatsApp Preview
                </p>
                <div className="text-sm text-slate-200 whitespace-pre-wrap">
                  {renderWhatsAppPreview(messageText)}
                </div>
              </div>
              <p className="text-xs text-yellow-500/80 bg-yellow-500/5 p-3 rounded-lg border border-yellow-500/10">
                Sistem akan menyimulasikan "typing" dan menggunakan delay acak
                antar pesan untuk menjaga keamanan akun Anda.
              </p>
            </div>
            <div className="p-6 bg-slate-800/10 flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSend}
                className="btn-primary rounded-xl px-6"
              >
                Ya, Kirim Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-800 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Detail Broadcast{" "}
                  <span className="text-slate-500 text-sm font-normal">
                    #{selectedLog.id.slice(-6)}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">
                    Total Target
                  </p>
                  <p className="text-lg font-bold text-white">
                    {selectedLog.recipientCount}
                  </p>
                </div>
                <div className="bg-emerald-900/10 p-3 rounded-xl border border-emerald-500/10">
                  <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1">
                    Berhasil
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    {selectedLog.successCount}
                  </p>
                </div>
                <div className="bg-red-900/10 p-3 rounded-xl border border-red-500/10">
                  <p className="text-[10px] text-red-500 uppercase font-black tracking-widest mb-1">
                    Gagal
                  </p>
                  <p className="text-lg font-bold text-red-400">
                    {selectedLog.failedCount}
                  </p>
                </div>
                <div className="bg-blue-900/10 p-3 rounded-xl border border-blue-500/10">
                  <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest mb-1">
                    Status
                  </p>
                  <p className="text-lg font-bold text-blue-400">
                    {selectedLog.status}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">
                  Isi Pesan
                </p>
                <div className="text-sm text-slate-300 font-mono bg-black/20 p-3 rounded-lg border border-slate-700/30 whitespace-pre-wrap italic">
                  {selectedLog.message}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <XCircle size={16} className="text-red-500" /> Log Kegagalan (
                  {details.length})
                </h3>

                {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <Loader2 className="animate-spin mb-2" />
                    <p className="text-xs">Memuat detail kegagalan...</p>
                  </div>
                ) : details.length > 0 ? (
                  <div className="space-y-2">
                    {details.map((detail) => (
                      <div
                        key={detail.id}
                        className="bg-slate-800/20 p-3 rounded-lg border border-slate-800 flex justify-between items-center group hover:border-red-500/20 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-200">
                            {detail.recipientName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {detail.recipientPhone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none mb-1">
                            Gagal
                          </p>
                          <p className="text-xs text-slate-400 italic">
                            {detail.reason || "Tidak ada alasan spesifik"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-800/10 rounded-xl border border-dashed border-slate-800">
                    <Check
                      className="mx-auto text-emerald-500 mb-2"
                      size={32}
                    />
                    <p className="text-sm text-slate-400">
                      Tidak ada kegagalan yang tercatat untuk broadcast ini.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-800/20 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">
                Database Transaction Safety Verified
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
