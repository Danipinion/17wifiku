// app/(dashboard)/admin/tagihan/page.tsx
import { TagihanClient } from "../_components/TagihanClient";
import {
  fetchInvoices,
  generateInvoicesForMonth,
  updateInvoiceStatus,
  bulkUpdateInvoiceStatus,
} from "../actions";

export default async function TagihanPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Tagihan</h1>
      <TagihanClient
        generateAction={generateInvoicesForMonth}
        updateStatusAction={updateInvoiceStatus}
        bulkUpdateStatusAction={bulkUpdateInvoiceStatus}
        fetchInvoicesAction={fetchInvoices}
      />
    </div>
  );
}
