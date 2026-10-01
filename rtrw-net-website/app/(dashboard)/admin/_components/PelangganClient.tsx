// app/(dashboard)/admin/_components/PelangganClient.tsx
"use client";

import Link from "next/link";
import { useState, useRef, useTransition, useMemo } from "react";
import { User, Invoice, UserStatus } from "@prisma/client";
import {
  PlusCircle,
  Loader2,
  UserX,
  UserCheck,
  MoreVertical,
  Edit,
  Search,
  KeyRound,
  Upload,
} from "lucide-react";
import { importPelangganFromExcel, resetPasswordAdmin } from "../actions";
import { toast } from "sonner";
import { Pagination } from "./Pagination";

type PelangganWithInvoices = User & {
  invoices: Invoice[];
  _count?: {
    referralsMade: number;
  };
};

type PelangganClientProps = {
  pelanggan: PelangganWithInvoices[];
  createAction: (
    formData: FormData,
  ) => Promise<{ success?: string; error?: string }>;
  updateStatusAction: (
    userId: string,
    newStatus: UserStatus,
  ) => Promise<{ success?: string; error?: string }>;
  updateAction: (
    formData: FormData,
  ) => Promise<{ success?: string; error?: string }>;
};

const ITEMS_PER_PAGE = 5;

export function PelangganClient({
  pelanggan,
  createAction,
  updateStatusAction,
  updateAction,
}: PelangganClientProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PelangganWithInvoices | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const addFormRef = useRef<HTMLFormElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredPelanggan = useMemo(() => {
    return pelanggan
      .filter((p) => {
        // Filter berdasarkan status
        if (statusFilter === "ALL") return true;
        return p.status === statusFilter;
      })
      .filter((p) => {
        // Filter berdasarkan search term (nama atau nomor hp)
        const term = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.phone.toLowerCase().includes(term)
        );
      });
  }, [pelanggan, statusFilter, searchTerm]);

  const totalPages = Math.ceil(filteredPelanggan.length / ITEMS_PER_PAGE);
  const paginatedPelanggan = filteredPelanggan.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handleFormSubmit = async (
    action: (
      formData: FormData,
    ) => Promise<{ success?: string; error?: string }>,
    formData: FormData,
    formRef: React.RefObject<HTMLFormElement>,
    onSuccess: () => void,
  ) => {
    setIsSubmitting(true);
    const result = await action(formData);
    if (result.success) {
      toast.success(result.success);
      formRef.current?.reset();
      setTimeout(() => {
        onSuccess();
        setMessage(null);
      }, 1500);
    } else if (result.error) {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const handleUpdateStatus = (userId: string, newStatus: UserStatus) => {
    startTransition(async () => {
      await updateStatusAction(userId, newStatus);
      setOpenDropdownId(null);
    });
  };

  const handleResetPassword = (userId: string, userName: string) => {
    if (
      confirm(
        `Anda yakin ingin mereset password untuk ${userName} ke "user1111"?`,
      )
    ) {
      startTransition(async () => {
        const result = await resetPasswordAdmin(userId);
        if (result.success) {
          toast.success(result.success);
        } else {
          toast.error(result.error);
        }
      });
    }
  };

  const handleImportSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Mengimpor data pelanggan...");
    const result = await importPelangganFromExcel(formData);
    if (result.success) {
      toast.success(result.success, { id: toastId });
      setIsImportModalOpen(false);
    } else {
      toast.error(result.error || "Gagal mengimpor.", { id: toastId });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="search"
            placeholder="Cari nama atau no. hp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 input-style"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | UserStatus)
            }
            className="select-style w-full sm:w-auto"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
          <div className="flex flex-col sm:flex-row  gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors flex-shrink-0"
            >
              <Upload size={18} />
              <span>Import Excel</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex-shrink-0"
            >
              <PlusCircle size={18} />
              <span>Tambah</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Pelanggan */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-4 hidden md:table-cell">ID Pelanggan</th>
              <th className="p-4">Nama</th>
              <th className="p-4 hidden md:table-cell">No. HP</th>
              <th className="p-4 hidden md:table-cell">Abonemen</th>
              <th className="p-4 hidden md:table-cell text-center">Referral</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPelanggan.map((p) => (
              <tr
                key={p.id}
                className="border-t border-slate-800 hover:bg-slate-800/30"
              >
                <td className="p-4 font-mono text-xs text-gray-400 hidden md:table-cell">
                  {p.idNumber}
                </td>
                <td className="p-4 font-semibold">
                  <Link
                    href={`/admin/pelanggan/${p.id}`}
                    className="hover:underline hover:text-blue-400"
                  >
                    {p.name}
                  </Link>
                  <span className="block md:hidden text-xs text-gray-400">
                    {p.phone}
                  </span>
                </td>
                <td className="p-4 text-gray-300 hidden md:table-cell">
                  {p.phone}
                </td>

                <td className="p-4 text-gray-300 hidden md:table-cell">
                  Rp {p.abonemen.toLocaleString("id-ID")}
                </td>
                <td className="p-4 text-center hidden md:table-cell">
                  {p._count?.referralsMade ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-black border border-blue-500/20">
                      {p._count.referralsMade} Orang
                    </span>
                  ) : (
                    <span className="text-slate-600 text-[10px] font-bold">
                      -
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs font-bold rounded-full ${
                      p.status === "ACTIVE"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {p.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {/* Dropdown Aksi */}
                  <div className="relative inline-block">
                    <button
                      onClick={() =>
                        setOpenDropdownId(openDropdownId === p.id ? null : p.id)
                      }
                      className="p-2 rounded-md hover:bg-slate-700"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openDropdownId === p.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => {
                            setEditingUser(p);
                            setOpenDropdownId(null);
                          }}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                        >
                          <Edit size={14} /> Edit Pelanggan
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(
                              p.id,
                              p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                            )
                          }
                          disabled={isPending}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                        >
                          {p.status === "ACTIVE" ? (
                            <UserX size={14} />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          {p.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => {
                            handleResetPassword(p.id, p.name);
                            setOpenDropdownId(null);
                          }}
                          disabled={isPending}
                          className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                        >
                          <KeyRound size={14} /> Reset Password
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold">Tambah Pelanggan Baru</h3>
            </div>
            <form
              ref={addFormRef}
              action={(formData) =>
                handleFormSubmit(createAction, formData, addFormRef, () => {})
              }
              className="p-6 space-y-4"
            >
              {/* Form inputs */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="w-full input-style"
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Nomor HP
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  className="w-full input-style"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="abonemen"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Tagihan Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    name="abonemen"
                    id="abonemen"
                    required
                    placeholder="150000"
                    className="w-full input-style"
                  />
                </div>
                <div>
                  <label
                    htmlFor="potongan"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    name="potongan"
                    id="potongan"
                    placeholder="0"
                    defaultValue={0}
                    className="w-full input-style"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Alamat
                </label>
                <textarea
                  name="address"
                  id="address"
                  rows={3}
                  className="w-full input-style"
                ></textarea>
              </div>

              {message && (
                <p
                  className={`text-sm ${
                    message.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-md hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-800"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Simpan Pelanggan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold">Edit Data Pelanggan</h3>
            </div>
            <form
              ref={editFormRef}
              action={(formData) =>
                handleFormSubmit(updateAction, formData, editFormRef, () =>
                  setEditingUser(null),
                )
              }
              className="p-6 space-y-4"
            >
              <input type="hidden" name="id" value={editingUser.id} />
              <div>
                <label htmlFor="name" className="block text-sm">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  defaultValue={editingUser.name}
                  className="w-full input-style"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  defaultValue={editingUser.phone}
                  className="w-full input-style"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="abonemen" className="block text-sm">
                    Tagihan Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    name="abonemen"
                    id="abonemen"
                    required
                    defaultValue={editingUser.abonemen}
                    className="w-full input-style"
                  />
                </div>
                <div>
                  <label htmlFor="potongan" className="block text-sm">
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    name="potongan"
                    id="potongan"
                    defaultValue={editingUser.potongan}
                    className="w-full input-style"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm">
                  Alamat
                </label>
                <textarea
                  name="address"
                  id="address"
                  rows={3}
                  defaultValue={editingUser.address || ""}
                  className="w-full input-style"
                ></textarea>
              </div>
              {message && (
                <p
                  className={`text-sm ${
                    message.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-md hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold">Import Pelanggan dari Excel</h3>
            </div>
            <form action={handleImportSubmit} className="p-6 space-y-4">
              <div className="text-sm p-4 bg-blue-950/50 border border-blue-800 rounded-md">
                <p className="font-semibold text-blue-300">Instruksi:</p>
                <ol className="list-decimal list-inside text-gray-400 mt-2 space-y-1">
                  <li>Unduh template yang sudah disediakan.</li>
                  <li>Isi data pelanggan sesuai kolom yang ada.</li>
                  <li>
                    Kolom `idNumber` bersifat opsional, jika dikosongkan akan
                    dibuat otomatis.
                  </li>
                  <li>Simpan file, lalu unggah di bawah ini.</li>
                </ol>
              </div>

              <a
                href="/template-pelanggan.xlsx"
                download
                className="text-sm text-blue-400 hover:underline font-semibold"
              >
                Unduh Template Excel di Sini
              </a>

              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Pilih File (.xlsx, .xls)
                </label>
                <input
                  type="file"
                  name="file"
                  id="file"
                  required
                  accept=".xlsx, .xls"
                  className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-gray-200 hover:file:bg-slate-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-md hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Upload />
                  )}
                  <span>Unggah & Proses</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
