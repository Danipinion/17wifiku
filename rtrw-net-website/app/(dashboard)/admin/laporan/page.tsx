// app/(dashboard)/admin/laporan/page.tsx
import { LaporanClient } from "../_components/LaporanClient";
import { fetchPaymentReport } from "../actions";

export default function LaporanPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Laporan Pembayaran</h1>
      <LaporanClient fetchReportAction={fetchPaymentReport} />
    </div>
  );
}
