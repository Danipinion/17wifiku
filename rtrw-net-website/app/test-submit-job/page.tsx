"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export default function InputPekerjaanPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    jobTypeId: "",
    notes: "",
    evidence: "https://placehold.co/600x400/png", // Mock image
    latitude: -6.2,
    longitude: 106.816666,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/employees").then((res) => res.json()),
      fetch("/api/admin/job-types").then((res) => res.json()),
    ])
      .then(([empData, jobData]) => {
        setEmployees(empData);
        setJobTypes(jobData);
        setLoading(false);
      })
      .catch((err) => {
        toast.error("Gagal memuat data");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Gagal kirim");

      toast.success("Pekerjaan berhasil dikirim!");
      // Reset logic if needed
    } catch (error) {
      toast.error("Gagal mengirim pekerjaan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-900 text-white min-h-screen">
      <h1 className="text-xl font-bold mb-6">
        Test Input Pekerjaan (Simulasi Mobile)
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-400">
            Pilih Teknisi
          </label>
          <select
            className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white"
            value={formData.userId}
            onChange={(e) =>
              setFormData({ ...formData, userId: e.target.value })
            }
            required
          >
            <option value="">-- Pilih --</option>
            {employees.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">
            Jenis Pekerjaan
          </label>
          <select
            className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white"
            value={formData.jobTypeId}
            onChange={(e) =>
              setFormData({ ...formData, jobTypeId: e.target.value })
            }
            required
          >
            <option value="">-- Pilih --</option>
            {jobTypes.map((j: any) => (
              <option key={j.id} value={j.id}>
                {j.name} - Rp {j.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-400">Catatan</label>
          <textarea
            className="w-full bg-slate-800 border-slate-700 rounded p-2 text-white"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </div>

        <div className="p-3 bg-slate-800 rounded text-xs text-gray-400">
          <p>Mock Data Otomatis:</p>
          <p>Lat: {formData.latitude}</p>
          <p>Long: {formData.longitude}</p>
          <p>Image: placeholder</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2"
        >
          {submitting ? (
            "Mengirim..."
          ) : (
            <>
              <Send size={16} /> Kirim Laporan
            </>
          )}
        </button>
      </form>
    </div>
  );
}
