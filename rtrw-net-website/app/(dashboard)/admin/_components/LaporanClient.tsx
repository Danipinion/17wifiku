// app/(dashboard)/admin/_components/LaporanClient.tsx
"use client";

import { useState, useRef } from "react";
import { DateRange } from "react-day-picker";
import { format, subDays, startOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Download,
  Loader2,
  LineChart,
  Info,
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { fetchPaymentReport } from "../actions";
import { Invoice, User } from "@prisma/client";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { toast } from "sonner";

// Tipe data untuk hasil laporan
// Tipe data
type PaymentWithUser = Invoice & {
  user: { name: string | null; idNumber: string | null };
};
type ReportData = {
  payments: PaymentWithUser[];
  summary: { totalRevenue: number; paymentCount: number };
} | null;
type LaporanClientProps = {
  fetchReportAction: typeof fetchPaymentReport;
};
type Preset = "today" | "last7" | "thisMonth" | "custom";

export function LaporanClient({ fetchReportAction }: LaporanClientProps) {
  // --- STATE MANAGEMENT ---
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportData, setReportData] = useState<ReportData>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(pickerRef, () => setIsPickerOpen(false));

  // --- HANDLER FUNCTIONS ---
  const handlePresetClick = (preset: Preset) => {
    const now = new Date();
    let range: DateRange;
    if (preset === "today") {
      range = { from: now, to: now };
    } else if (preset === "last7") {
      range = { from: subDays(now, 6), to: now };
    } else {
      // thisMonth
      range = { from: startOfMonth(now), to: now };
    }
    setDateRange(range);
    setActivePreset(preset);
  };

  const handleGenerateReport = async () => {
    if (!dateRange?.from) {
      toast.error("Silakan pilih rentang tanggal.");
      return;
    }
    setIsLoading(true);
    setReportData(null);

    const startDate = dateRange.from;
    const endDate = dateRange.to || dateRange.from; // Jika 'to' null, gunakan 'from'
    endDate.setHours(23, 59, 59, 999);

    const result = await fetchReportAction({ startDate, endDate });
    if (result.error) {
      toast.error(result.error);
    } else {
      setReportData({
        payments: result.payments as any,
        summary: result.summary as any,
      });
    }
    setIsLoading(false);
  };

  const handleExportCsv = () => {
    if (!reportData || reportData.payments.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    const headers = [
      "Tanggal Bayar",
      "ID Pelanggan",
      "Nama Pelanggan",
      "Periode Tagihan",
      "Jumlah",
    ];
    const csvRows = [headers.join(",")];

    reportData.payments.forEach((p) => {
      const row = [
        format(p.paidAt!, "yyyy-MM-dd HH:mm"),
        p.user.idNumber || "",
        `"${p.user.name}"`,
        `${new Date(0, p.month - 1).toLocaleString("id-ID", {
          month: "long",
        })} ${p.year}`,
        p.amount,
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute(
      "download",
      `laporan-pembayaran-${format(dateRange!.from!, "yyyy-MM-dd")}-sd-${format(
        dateRange!.to!,
        "yyyy-MM-dd"
      )}.csv`
    );
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* --- FILTER BAR --- */}
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 space-y-4">
        <p className="font-semibold text-white">Pilih Periode Laporan</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePresetClick("last7")}
            className={`btn-filter ${activePreset === "last7" ? "active" : ""}`}
          >
            7 Hari Terakhir
          </button>
          <button
            onClick={() => handlePresetClick("thisMonth")}
            className={`btn-filter ${
              activePreset === "thisMonth" ? "active" : ""
            }`}
          >
            Bulan Ini
          </button>

          {/* Tombol Date Picker Popover */}
          <div ref={pickerRef} className="relative">
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className={`btn-filter flex ${
                activePreset === "custom" ? "active" : ""
              }`}
            >
              <CalendarIcon size={16} className="mr-2" />
              <span>
                {dateRange?.from
                  ? dateRange.to
                    ? `${format(dateRange.from, "d LLL y")} - ${format(
                        dateRange.to,
                        "d LLL y"
                      )}`
                    : format(dateRange.from, "d LLL y")
                  : "Pilih Tanggal"}
              </span>
            </button>
            {isPickerOpen && (
              <div className="absolute top-full mt-2 z-10 bg-slate-900 border border-slate-700 rounded-md shadow-lg">
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setActivePreset("custom");
                  }}
                  locale={idLocale}
                  defaultMonth={dateRange?.from}
                  numberOfMonths={1}
                  disabled={{ after: new Date() }} // Nonaktifkan tanggal di masa depan
                />
              </div>
            )}
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="btn-primary flex-grow sm:flex-grow-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              "Buat Laporan"
            )}
          </button>
        </div>
      </div>

      {/* --- HASIL LAPORAN --- */}
      {isLoading && (
        <div className="text-center p-8">
          <Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
        </div>
      )}
      {!isLoading && !reportData && (
        <div className="text-center p-12 bg-slate-900 rounded-lg border border-slate-800">
          <LineChart className="mx-auto text-slate-600" size={48} />
          <h3 className="mt-4 text-xl font-semibold text-white">
            Siap Menerima Laporan
          </h3>
          <p className="mt-1 text-gray-400">
            Pilih periode di atas dan klik &quot;Buat Laporan&quot; untuk
            melihat data pembayaran.
          </p>
        </div>
      )}
      {reportData && (
        <div className="space-y-6">
          {/* Ringkasan Laporan */}
          <div className="bg-slate-900 rounded-lg border border-slate-800">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-lg">Ringkasan Laporan</h3>
              <p className="text-sm text-gray-400">
                Periode: {format(dateRange!.from!, "d LLL yyyy")} -{" "}
                {format(dateRange!.to || dateRange!.from!, "d LLL yyyy")}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6">
                <p className="text-sm text-gray-400">Total Pemasukan</p>
                <p className="text-3xl font-bold text-green-400">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  }).format(reportData.summary.totalRevenue)}
                </p>
              </div>
              <div className="p-6 md:border-l border-slate-800">
                <p className="text-sm text-gray-400">Jumlah Transaksi Lunas</p>
                <p className="text-3xl font-bold">
                  {reportData.summary.paymentCount}
                </p>
              </div>
            </div>
          </div>

          {/* Detail Pembayaran */}
          <div className="bg-slate-900 rounded-lg border border-slate-800 max-w-[92vw] sm:max-w-none">
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-lg">Detail Pembayaran</h3>
              <button
                onClick={handleExportCsv}
                disabled={reportData.payments.length === 0}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={16} /> Export ke CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/50">
                  <tr className="border-b border-slate-800">
                    <th className="p-3">Tanggal Bayar</th>
                    <th className="p-3 hidden md:table-cell">ID Pel.</th>
                    <th className="p-3">Nama Pelanggan</th>
                    <th className="p-3">Periode Tagihan</th>
                    <th className="p-3 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.payments.length > 0 ? (
                    reportData.payments.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-800 last:border-b-0 odd:bg-slate-800/20"
                      >
                        <td className="p-3 whitespace-nowrap">
                          {format(p.paidAt!, "dd MMM, HH:mm", {
                            locale: idLocale,
                          })}
                        </td>
                        <td className="p-3 font-mono text-xs hidden md:table-cell">
                          {p.user.idNumber}
                        </td>
                        <td className="p-3 font-semibold">{p.user.name}</td>
                        <td className="p-3 whitespace-nowrap">
                          {new Date(0, p.month - 1).toLocaleString("id-ID", {
                            month: "numeric",
                          })}
                          -{p.year.toString().slice(-2)}
                        </td>
                        <td className="p-3 text-right font-semibold text-green-400">
                          Rp {p.amount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 p-8">
                        <Info size={20} className="mx-auto mb-2" />
                        Tidak ada pembayaran pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
