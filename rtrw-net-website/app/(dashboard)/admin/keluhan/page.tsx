// app/(dashboard)/admin/keluhan/page.tsx

import { KeluhanClient } from "../_components/KeluhanClient";
import { fetchKeluhan, updateComplaintStatus } from "../actions";

export default function KeluhanPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manajemen Keluhan</h1>
      <KeluhanClient
        fetchKeluhanAction={fetchKeluhan}
        updateStatusAction={updateComplaintStatus}
      />
    </div>
  );
}
