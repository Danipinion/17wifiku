"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  username: string; // email
  phone: string;
  address: string;
  baseSalary: number;
  completedJobsTotal?: number;
  totalSalary?: number;
  status: string;
  createdAt: string;
}

const currentDate = new Date();

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Employee>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    baseSalary: 0,
  });

  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());

  const router = useRouter();

  useEffect(() => {
    fetchEmployees();
  }, [filterMonth, filterYear]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/employees?month=${filterMonth}&year=${filterYear}`,
      );
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      toast.error("Gagal mengambil data karyawan");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/admin/employees/${currentItem.id}`
        : "/api/admin/employees";

      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Gagal menyimpan data");

      toast.success(isEditing ? "Karyawan diperbarui" : "Karyawan ditambahkan");
      setShowModal(false);
      fetchEmployees();
      setFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        baseSalary: 0,
      });
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan ${name}?`)) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus");

      toast.success("Karyawan dihapus");
      fetchEmployees();
    } catch (error) {
      toast.error("Gagal menghapus data");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase()),
  );

  const grandTotalSalary = filteredEmployees.reduce(
    (sum, emp) => sum + (emp.totalSalary || 0),
    0,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Karyawan</h1>
          <p className="text-gray-400">Kelola data karyawan dan teknisi</p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setFormData({
              name: "",
              email: "",
              password: "",
              phone: "",
              address: "",
              baseSalary: 0,
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Tambah Karyawan
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="relative flex-grow max-w-md w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 w-full md:w-auto"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("id-ID", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 w-full md:w-auto"
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 flex justify-between items-center">
          <span className="text-gray-300 font-medium">
            Total Gaji Bulan Ini:
          </span>
          <span className="text-xl font-bold text-blue-400">
            {formatCurrency(grandTotalSalary)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs uppercase bg-slate-950 text-gray-300">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email/Username</th>
                <th className="px-4 py-3">No. HP</th>
                <th className="px-4 py-3">Gaji Pokok</th>
                <th className="px-4 py-3">Pendapatan Pekerjaan</th>
                <th className="px-4 py-3">Total Gaji</th>
                <th className="px-4 py-3">Alamat</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data karyawan
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-white">
                      {emp.name}
                    </td>
                    <td className="px-4 py-3">{emp.username}</td>
                    <td className="px-4 py-3">{emp.phone}</td>
                    <td className="px-4 py-3">
                      {formatCurrency(emp.baseSalary || 0)}
                    </td>
                    <td className="px-4 py-3 text-green-400">
                      + {formatCurrency(emp.completedJobsTotal || 0)}
                    </td>
                    <td className="px-4 py-3 font-bold text-blue-400">
                      {formatCurrency(emp.totalSalary || 0)}
                    </td>
                    <td
                      className="px-4 py-3 truncate max-w-[200px]"
                      title={emp.address}
                    >
                      {emp.address}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-1.5 hover:bg-blue-900/30 text-blue-400 rounded-md transition-colors"
                          onClick={() => {
                            setIsEditing(true);
                            setCurrentItem(emp);
                            setFormData({
                              name: emp.name,
                              email: emp.username,
                              password: "", // Password optional on edit
                              phone: emp.phone,
                              address: emp.address,
                              baseSalary: emp.baseSalary || 0,
                            });
                            setShowModal(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-900/30 text-red-400 rounded-md transition-colors"
                          onClick={() => handleDelete(emp.id, emp.name)}
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
              {isEditing ? "Edit Karyawan" : "Tambah Karyawan Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nama Lengkap
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
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Password{" "}
                  {isEditing ? "(Kosongkan jika tidak ubah)" : "Default"}
                </label>
                <input
                  required={!isEditing}
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  No. HP (WhatsApp)
                </label>
                <input
                  required
                  type="text"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Gaji Pokok (Rp)
                </label>
                <input
                  required
                  type="number"
                  value={formData.baseSalary === 0 ? "" : formData.baseSalary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      baseSalary: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Alamat
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
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
