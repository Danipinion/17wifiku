"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface JobType {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function JobTypesPage() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<JobType>>({});
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
  });

  useEffect(() => {
    fetchJobTypes();
  }, []);

  const fetchJobTypes = async () => {
    try {
      const res = await fetch("/api/admin/job-types");
      const data = await res.json();
      setJobTypes(data);
    } catch (error) {
      toast.error("Gagal mengambil data jenis pekerjaan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/admin/job-types/${currentItem.id}`
        : "/api/admin/job-types";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success("Jenis pekerjaan ditambahkan");
      setShowModal(false);
      fetchJobTypes();
      setFormData({
        name: "",
        price: 0,
        description: "",
      });
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus jenis pekerjaan ${name}?`))
      return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/job-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success("Jenis pekerjaan dihapus");
      fetchJobTypes();
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobTypes = jobTypes.filter((job) =>
    job.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Jenis Pekerjaan</h1>
          <p className="text-gray-400">
            Atur harga dan jenis pekerjaan teknisi
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setFormData({
              name: "",
              price: 0,
              description: "",
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Tambah Jenis
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="relative mb-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Cari jenis pekerjaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-slate-950 text-gray-300">
              <tr>
                <th className="px-4 py-3">Nama Pekerjaan</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Harga Komisi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredJobTypes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data jenis pekerjaan
                  </td>
                </tr>
              ) : (
                filteredJobTypes.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">
                      {job.name}
                    </td>
                    <td className="px-4 py-3 truncate max-w-[250px]">
                      {job.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-green-400 font-medium">
                      Rp {job.price.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 hover:bg-blue-900/30 text-blue-400 rounded-md transition-colors"
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentItem(job);
                            setFormData({
                              name: job.name,
                              price: job.price,
                              description: job.description,
                            });
                            setShowModal(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-900/30 text-red-400 rounded-md transition-colors"
                          onClick={() => handleDelete(job.id, job.name)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-white mb-4">
              {isEditing ? "Edit Jenis Pekerjaan" : "Tambah Jenis Pekerjaan"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nama Pekerjaan
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Harga Komisi (Rp)
                </label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
