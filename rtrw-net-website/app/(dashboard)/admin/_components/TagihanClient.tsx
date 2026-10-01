"use client";
import { useDebounce } from "@/hooks/useDebounce";
import { Invoice, InvoiceStatus } from "@prisma/client";
import {
  Check,
  Loader2,
  Printer,
  Search,
  Users,
  Wallet,
  X,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  fetchInvoices,
  deleteInvoices,
  updateInvoiceDetails,
} from "../actions";
import PrintButton, { triggerPrint } from "./PrintButton";

type InvoiceWithUser = Invoice & {
  user: { name: string | null; phone: string };
};

type TagihanClientProps = {
  generateAction: (
    formData: FormData
  ) => Promise<{ success?: string; error?: string }>;
  updateStatusAction: (
    invoiceId: string,
    newStatus: "PAID" | "UNPAID"
  ) => Promise<
    | { success?: string; error?: string; message?: string; pdfUrl?: string }
    | undefined
  >;
  bulkUpdateStatusAction: (
    invoiceIds: string[]
  ) => Promise<
    | { success?: string; error?: string; message?: string; pdfUrls?: string[] }
    | undefined
  >;
  fetchInvoicesAction: typeof fetchInvoices;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  name: new Date(2000, i).toLocaleString("id-ID", { month: "long" }),
}));

type ConfirmationModalState = {
  type:
    | "PAY_SINGLE"
    | "PAY_BULK"
    | "CANCEL_SINGLE"
    | "DELETE_SINGLE"
    | "DELETE_BULK";
  data: any;
};

export function TagihanClient({
  generateAction,
  updateStatusAction,
  bulkUpdateStatusAction,
  fetchInvoicesAction,
}: TagihanClientProps) {
  const [invoices, setInvoices] = useState<InvoiceWithUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({ totalCount: 0, totalAmount: 0 });

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [status, setStatus] = useState<InvoiceStatus | "ALL">("UNPAID");
  const [month, setMonth] = useState<number | "ALL">("ALL");
  const [year, setYear] = useState<number | "ALL">("ALL");

  const [isPending, startTransition] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);
  const [generatorMessage, setGeneratorMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceWithUser | null>(
    null
  );
  const [editAmount, setEditAmount] = useState("");

  const selectedInvoiceObjects = useMemo(() => {
    return invoices.filter((inv) => selectedInvoices.includes(inv.id));
  }, [invoices, selectedInvoices]);

  const selectedStatus = useMemo(() => {
    if (selectedInvoices.length === 0) {
      return { hasPaid: false, hasUnpaid: false };
    }

    let hasPaid = false;
    let hasUnpaid = false;

    for (const inv of selectedInvoiceObjects) {
      if (inv.status === "PAID" && inv.pdfUrl) {
        hasPaid = true;
      } else if (inv.status === "UNPAID") {
        hasUnpaid = true;
      }
      if (hasPaid && hasUnpaid) break;
    }

    return { hasPaid, hasUnpaid };
  }, [selectedInvoiceObjects]);

  const loadInvoices = useCallback(
    async (isNewSearch = false) => {
      setIsLoading(true);
      const currentPage = isNewSearch ? 1 : page;

      const result = await fetchInvoicesAction({
        query: debouncedQuery,
        status: status === "ALL" ? undefined : status,
        month: month === "ALL" ? undefined : month,
        year: year === "ALL" ? undefined : year,
        page: currentPage,
      });

      if (result.invoices) {
        setInvoices((prev) =>
          isNewSearch ? result.invoices! : [...prev, ...result.invoices!]
        );
        setHasMore(result.hasMore);
        if (result.summary) {
          setSummary(result.summary);
        }
        if (!isNewSearch) {
          setPage((p) => p + 1);
        }
      }
      setIsLoading(false);
    },
    [page, debouncedQuery, status, month, year, fetchInvoicesAction]
  );

  useEffect(() => {
    setInvoices([]);
    setPage(1);
    setHasMore(true);
    setSelectedInvoices([]);
    loadInvoices(true);
  }, [debouncedQuery, status, month, year]);

  const handleGenerateInvoices = async (formData: FormData) => {
    const result = await generateAction(formData);
    if (result.success) {
      toast.success(result.success);

      setQuery("");
      setStatus("ALL");
      setMonth("ALL");
      setYear("ALL");
      loadInvoices(true);
    } else if (result.error) {
      setGeneratorMessage({ type: "error", text: result.error });
    }
  };

  const handleUpdateStatus = (
    invoiceId: string,
    newStatus: "PAID" | "UNPAID"
  ) => {
    startTransition(async () => {
      setConfirmationModal(null);

      const actionText =
        newStatus === "PAID" ? "Menandai lunas" : "Membatalkan";
      const toastId = toast.loading(`${actionText} tagihan...`);

      const result = await updateStatusAction(invoiceId, newStatus);

      if (result?.success) {
        toast.success(result.success, { id: toastId });

        loadInvoices(true);
        if (newStatus === "PAID" && result.pdfUrl) {
          setIsPrinting(true);
          await triggerPrint(result.pdfUrl);
          setIsPrinting(false);
        }
      } else if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else if (result?.message) {
        toast.info(result.message, { id: toastId });
      } else {
        toast.error("Terjadi kesalahan yang tidak diketahui.", { id: toastId });
      }
    });
  };

  const handleBulkPrint = () => {
    setIsPrinting(true);
    const urlsToPrint = selectedInvoices
      .map((selectedId) => {
        const inv = invoices.find((i) => i.id === selectedId);
        if (inv && inv.status === "PAID" && inv.pdfUrl) {
          return inv.pdfUrl;
        }
        return null;
      })
      .filter((url): url is string => !!url);

    if (urlsToPrint.length === 0) {
      toast.info(
        "Pilih tagihan yang sudah LUNAS (dan memiliki nota) untuk dicetak."
      );
      setIsPrinting(false);
      return;
    }

    triggerPrint(urlsToPrint).finally(() => {
      setIsPrinting(false);
    });
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    setSelectedInvoices((prev) =>
      checked ? [...prev, invoiceId] : prev.filter((id) => id !== invoiceId)
    );
  };

  const handleBulkPay = () => {
    startTransition(async () => {
      setConfirmationModal(null);

      const toastId = toast.loading(
        `Menandai lunas ${selectedInvoices.length} tagihan...`
      );

      const result = await bulkUpdateStatusAction(selectedInvoices);

      if (result?.success) {
        toast.success(result.success, { id: toastId });
        setSelectedInvoices([]);
        loadInvoices(true);

        if (result.pdfUrls && result.pdfUrls.length > 0) {
          setIsPrinting(true);
          try {
            await triggerPrint(result.pdfUrls);
          } catch (printError) {
            console.error("Gagal auto bulk print:", printError);
            toast.error("Gagal otomatis mencetak nota.");
          } finally {
            setIsPrinting(false);
          }
        }
      } else if (result?.error) {
        toast.error(result.error, { id: toastId });
      } else if (result?.message) {
        toast.info(result.message, { id: toastId });
      } else {
        toast.error("Terjadi kesalahan yang tidak diketahui.", { id: toastId });
      }
    });
  };

  const openEditModal = (invoice: InvoiceWithUser) => {
    setEditingInvoice(invoice);
    setEditAmount(invoice.amount.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;
    startTransition(async () => {
      const result = await updateInvoiceDetails(editingInvoice.id, {
        amount: parseFloat(editAmount),
      });

      if (result.success) {
        toast.success(result.success);
        setIsEditModalOpen(false);
        setEditingInvoice(null);
        loadInvoices(true);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = async () => {
    if (!confirmationModal) return;

    startTransition(async () => {
      let idsToDelete: string[] = [];
      if (confirmationModal.type === "DELETE_SINGLE") {
        idsToDelete = [(confirmationModal.data as InvoiceWithUser).id];
      } else if (confirmationModal.type === "DELETE_BULK") {
        idsToDelete = selectedInvoices;
      }

      const result = await deleteInvoices(idsToDelete);

      if (result.success) {
        toast.success(result.success);
        setConfirmationModal(null);
        setSelectedInvoices([]);
        loadInvoices(true);
      } else {
        toast.error(result.error);
      }
    });
  };

  const onConfirmAction = () => {
    if (!confirmationModal) return;

    switch (confirmationModal.type) {
      case "PAY_SINGLE":
        const invoice = confirmationModal.data as InvoiceWithUser;
        handleUpdateStatus(invoice.id, "PAID");
        break;
      case "CANCEL_SINGLE":
        const invoiceToCancel = confirmationModal.data as InvoiceWithUser;
        handleUpdateStatus(invoiceToCancel.id, "UNPAID");
        break;
      case "PAY_BULK":
        handleBulkPay();
        break;
      case "DELETE_SINGLE":
      case "DELETE_BULK":
        handleDelete();
        break;
    }
  };

  const isAllSelected =
    invoices.length > 0 && selectedInvoices.length === invoices.length;
  const isIndeterminate =
    selectedInvoices.length > 0 && selectedInvoices.length < invoices.length;

  return (
    <div className="space-y-8">
      <div className="p-6 bg-slate-900 rounded-lg border border-slate-800">
        <h2 className="text-xl font-bold mb-4">Buat Tagihan Bulanan</h2>
        <form
          action={handleGenerateInvoices}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <select
            defaultValue={new Date().getMonth() + 1}
            name="month"
            required
            className="select-style"
          >
            <option value="">Pilih Bulan</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            defaultValue={new Date().getFullYear()}
            name="year"
            required
            className="select-style"
          >
            <option value="">Pilih Tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Buat Tagihan
          </button>
        </form>
        {generatorMessage && (
          <p
            className={`mt-4 text-sm ${
              generatorMessage.type === "success"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {generatorMessage.text}
          </p>
        )}
      </div>

      {status === "UNPAID" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/20 text-red-400">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pelanggan Belum Bayar</p>
              <p className="text-3xl font-bold">{summary.totalCount}</p>
            </div>
          </div>
          <div className="p-6 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/20 text-yellow-400">
              <Wallet size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Tagihan Tertunggak</p>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                }).format(summary.totalAmount)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <input
            type="search"
            placeholder="Cari nama pelanggan..."
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 input-style"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="select-style"
        >
          <option value="ALL">Semua Status</option>
          <option value="UNPAID">Belum Lunas</option>
          <option value="PAID">Lunas</option>
        </select>
        <select
          onChange={(e) =>
            setMonth(
              e.target.value === "ALL" ? "ALL" : parseInt(e.target.value)
            )
          }
          className="select-style"
        >
          <option value="ALL">Semua Bulan</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          onChange={(e) =>
            setYear(e.target.value === "ALL" ? "ALL" : parseInt(e.target.value))
          }
          className="select-style"
        >
          <option value="ALL">Semua Tahun</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {selectedInvoices.length > 0 && (
          <div className="flex justify-start gap-2 md:col-span-4">
            {selectedStatus.hasUnpaid && !selectedStatus.hasPaid && (
              <button
                onClick={() =>
                  setConfirmationModal({
                    type: "PAY_BULK",
                    data: selectedInvoices,
                  })
                }
                disabled={isPending || isPrinting}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Bayar ({selectedInvoices.length})
              </button>
            )}

            {selectedStatus.hasUnpaid && !selectedStatus.hasPaid && (
              <button
                onClick={() =>
                  setConfirmationModal({
                    type: "DELETE_BULK",
                    data: selectedInvoices,
                  })
                }
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2"
              >
                <Trash2 size={16} />
                Hapus ({selectedInvoices.length})
              </button>
            )}

            {selectedStatus.hasPaid && !selectedStatus.hasUnpaid && (
              <button
                onClick={handleBulkPrint}
                disabled={isPending || isPrinting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isPrinting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Printer size={16} />
                )}
                Cetak Nota ({selectedInvoices.length})
              </button>
            )}

            {selectedStatus.hasPaid && selectedStatus.hasUnpaid && (
              <div className="flex items-center text-sm text-yellow-400 bg-yellow-900/50 px-4 py-2 rounded-md">
                Harap pilih tagihan dengan status yang sama untuk aksi massal.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600 disabled:opacity-50"
                  disabled={isPending || isPrinting || invoices.length === 0}
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isIndeterminate;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedInvoices(invoices.map((i) => i.id));
                    } else {
                      setSelectedInvoices([]);
                    }
                  }}
                />
              </th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4 hidden md:table-cell">Periode</th>
              <th className="p-4 hidden md:table-cell">Jumlah</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-slate-800">
                <td className="p-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-600"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={(e) =>
                      handleSelectInvoice(invoice.id, e.target.checked)
                    }
                    disabled={isPending || isPrinting}
                  />
                </td>
                <td className="p-4">
                  {invoice.user.name} ({invoice.user.phone})
                  <div className="block md:hidden text-xs text-gray-400 mt-1">
                    <span>
                      {months.find((m) => m.value === invoice.month)?.name}{" "}
                      {invoice.year}
                    </span>
                    <span className="text-red-400">
                      {" "}
                      - Rp {invoice.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  {months.find((m) => m.value === invoice.month)?.name}{" "}
                  {invoice.year}
                </td>
                <td className="p-4 hidden md:table-cell">
                  Rp {invoice.amount.toLocaleString("id-ID")}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      invoice.status === "PAID"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="p-4 text-xs">
                  {invoice.paidAt
                    ? `${invoice.paidAt.getDate()}/${String(
                        invoice.paidAt.getMonth() + 1
                      ).padStart(2, "0")}/${String(
                        invoice.paidAt.getFullYear()
                      ).slice(2)}`
                    : "-"}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {invoice.status === "UNPAID" ? (
                      <>
                        <button
                          onClick={() =>
                            setConfirmationModal({
                              type: "PAY_SINGLE",
                              data: invoice,
                            })
                          }
                          className="flex items-center justify-center p-2 text-xs rounded bg-green-600 hover:bg-green-700"
                          disabled={isPending}
                        >
                          <Check size={16} />
                          <span className="hidden sm:inline sm:ml-1.5">
                            Lunas
                          </span>
                        </button>
                        <button
                          onClick={() => openEditModal(invoice)}
                          className="flex items-center justify-center p-2 text-xs rounded bg-yellow-600 hover:bg-yellow-700 text-white"
                          title="Edit Tagihan"
                          disabled={isPending}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmationModal({
                              type: "DELETE_SINGLE",
                              data: invoice,
                            })
                          }
                          className="flex items-center justify-center p-2 text-xs rounded bg-slate-700 hover:bg-slate-600 text-red-400"
                          title="Hapus Tagihan"
                          disabled={isPending}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <PrintButton url={invoice.pdfUrl ?? ""} />

                        <button
                          onClick={() =>
                            setConfirmationModal({
                              type: "CANCEL_SINGLE",
                              data: invoice,
                            })
                          }
                          className="flex items-center justify-center p-2 text-xs rounded bg-red-600 hover:bg-red-700"
                          title="Batalkan Pembayaran"
                          disabled={isPending}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        {isLoading && (
          <Loader2 className="animate-spin mx-auto text-gray-400" size={28} />
        )}
        {hasMore && !isLoading && (
          <button
            onClick={() => loadInvoices()}
            className="px-6 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 rounded-md"
          >
            Muat Lebih Banyak
          </button>
        )}
        {!hasMore && !isLoading && invoices.length > 0 && (
          <p className="text-gray-500">Sudah menampilkan semua data.</p>
        )}
        {invoices.length === 0 && !isLoading && (
          <p className="text-gray-500">
            Tidak ada data tagihan yang ditemukan.
          </p>
        )}
      </div>

      {isEditModalOpen && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-xl font-bold mb-4">Edit Tagihan</h2>
            <p className="text-slate-400 mb-4">
              {editingInvoice.user.name} -{" "}
              {months.find((m) => m.value === editingInvoice.month)?.name}{" "}
              {editingInvoice.year}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jumlah Tagihan (Rp)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full p-2 rounded bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isPending}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                {isPending ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-lg shadow-xl p-6 w-full max-w-sm border border-slate-700">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-full mr-4 ${
                  confirmationModal.type === "CANCEL_SINGLE"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-bold">Konfirmasi Tindakan</h2>
            </div>
            <div className="mt-4 text-slate-300">
              {confirmationModal.type === "PAY_SINGLE" && (
                <p>
                  Anda yakin ingin menandai tagihan untuk{" "}
                  <strong className="text-white">
                    {(confirmationModal.data as InvoiceWithUser).user.name}
                  </strong>{" "}
                  sebagai LUNAS?
                </p>
              )}
              {confirmationModal.type === "CANCEL_SINGLE" && (
                <p>
                  Anda yakin ingin MEMBATALKAN pembayaran untuk{" "}
                  <strong className="text-white">
                    {(confirmationModal.data as InvoiceWithUser).user.name}
                  </strong>
                  ? Status akan kembali ke UNPAID.
                </p>
              )}
              {confirmationModal.type === "PAY_BULK" && (
                <p>
                  Anda yakin ingin melunasi{" "}
                  <strong className="text-white">
                    {selectedInvoices.length}
                  </strong>{" "}
                  tagihan yang dipilih?
                </p>
              )}
              {(confirmationModal.type === "DELETE_SINGLE" ||
                confirmationModal.type === "DELETE_BULK") && (
                <p className="text-red-400">
                  PERINGATAN: Anda akan menghapus{" "}
                  {confirmationModal.type === "DELETE_BULK"
                    ? selectedInvoices.length
                    : 1}{" "}
                  tagihan secara permanen. Data tidak dapat dikembalikan.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmationModal(null)}
                disabled={isPending}
                className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-medium disabled:opacity-50"
              >
                Tutup
              </button>
              <button
                onClick={onConfirmAction}
                disabled={isPending}
                className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 flex items-center ${
                  confirmationModal.type === "CANCEL_SINGLE"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : null}
                {isPending ? "Memproses..." : "Ya, Lanjutkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
