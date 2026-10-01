"use client";

import {
  Complaint,
  ComplaintStatus,
  Invoice,
  InvoiceStatus,
  User,
  UserStatus,
} from "@prisma/client";
import {
  BellRing,
  Edit,
  FileText,
  Loader2,
  MessageSquareWarning,
  UserCheck,
  UserX,
  Cpu,
  Check,
  X,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { sendBillingReminder } from "../../../actions";
import PrintButton, { triggerPrint } from "../../../_components/PrintButton";
import { useRouter } from "next/navigation";
import { DeviceAssociation } from "./DeviceAssociation";
import { GenieACSDevice } from "@/lib/genieacs";

type PelangganDetail = User & {
  invoices: Invoice[];
  complaints: Complaint[];
  genieacsDevices: any[];
  referralsMade: {
    id: string;
    referee: {
      id: string;
      name: string;
      idNumber: string | null;
      phone: string;
      status: UserStatus;
      invoices: {
        status: InvoiceStatus;
        month: number;
        year: number;
      }[];
    };
  }[];
};

type LinkedDeviceWithData = {
  id: string;
  deviceId: string;
  name: string | null;
  genieacsData: GenieACSDevice | null;
};

type DetailPelangganClientProps = {
  pelanggan: PelangganDetail;
  updateStatusAction: (userId: string, newStatus: UserStatus) => Promise<any>;
  updateAction: (formData: FormData) => Promise<any>;
  updateInvoiceStatusAction: (
    invoiceId: string,
    newStatus: InvoiceStatus,
  ) => Promise<
    | {
        success?: string;
        error?: string;
        message?: string;
        pdfUrl?: string;
      }
    | undefined
  >;
  updateComplaintStatusAction: (
    complaintId: string,
    newStatus: ComplaintStatus,
  ) => Promise<void>;
  linkGenieACSDeviceAction: (
    userId: string,
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  unlinkGenieACSDeviceAction: (
    userId: string,
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  renameGenieACSDeviceAction: (
    deviceId: string,
    newName: string,
  ) => Promise<{ success?: string; error?: string }>;
  rebootGenieACSDeviceAction: (
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  refreshGenieACSDeviceAction: (
    deviceId: string,
  ) => Promise<{ success?: string; error?: string }>;
  changeWifiPasswordAction: (
    deviceId: string,
    passwordBaru: string,
  ) => Promise<{ success?: string; error?: string }>;
  linkedDevices: LinkedDeviceWithData[];
  unlinkedDevices: GenieACSDevice[];
};

const monthNames = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Ags",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function DetailPelangganClient({
  pelanggan,
  updateStatusAction,
  updateAction,
  updateInvoiceStatusAction,
  updateComplaintStatusAction,
  linkGenieACSDeviceAction,
  unlinkGenieACSDeviceAction,
  renameGenieACSDeviceAction,
  rebootGenieACSDeviceAction,
  refreshGenieACSDeviceAction,
  changeWifiPasswordAction,
  linkedDevices,
  unlinkedDevices,
}: DetailPelangganClientProps) {
  const [activeTab, setActiveTab] = useState<
    "tagihan" | "keluhan" | "router" | "referral"
  >("tagihan");
  const [isPending, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<PelangganDetail | null>(null);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const editFormRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const unpaidInvoices = pelanggan.invoices.filter(
    (inv) => inv.status === "UNPAID",
  );
  const totalTunggakan = unpaidInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0,
  );

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const activeReferrals = pelanggan.referralsMade.filter((ref) => {
    const referee = ref.referee;
    const currentInvoice = referee.invoices.find(
      (inv) => inv.month === currentMonth && inv.year === currentYear,
    );
    const hasArrears = referee.invoices.some((inv) => inv.status === "UNPAID");

    return currentInvoice?.status === "PAID" && !hasArrears;
  });

  const referralDiscountValue = activeReferrals.length * 10000;
  const totalDiscount = pelanggan.potongan + referralDiscountValue;

  const handleUpdateStatus = (userId: string, newStatus: UserStatus) => {
    startTransition(() => {
      updateStatusAction(userId, newStatus);
    });
  };

  const handleFormSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setMessage(null);
    const result = await updateAction(formData);
    if (result.success) {
      setMessage({ type: "success", text: result.success });
      setTimeout(() => {
        setEditingUser(null);
        setMessage(null);
      }, 1500);
    } else if (result.error) {
      setMessage({ type: "error", text: result.error });
    }
    setIsSubmitting(false);
  };

  const handleSendReminder = () => {
    startTransition(async () => {
      const result = await sendBillingReminder(pelanggan.id);
      if (result.success) {
        toast.success(result.success);
        setIsReminderModalOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- KOLOM KIRI: KARTU INFO PELANGGAN --- */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-blue-500/20 mx-auto flex items-center justify-center text-blue-400 text-4xl font-bold">
                {pelanggan.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold mt-4">{pelanggan.name}</h2>
              <p className="text-gray-400">{pelanggan.phone}</p>
              <span
                className={`mt-2 inline-block px-3 py-1 text-xs font-bold rounded-full ${
                  pelanggan.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-gray-500/20 text-gray-400"
                }`}
              >
                Status:{" "}
                {pelanggan.status === "ACTIVE" ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>

            <div className="space-y-3 text-sm border-t border-slate-800 pt-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Alamat:</span>{" "}
                <span className="font-semibold text-right">
                  {pelanggan.address || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tagihan/Bulan:</span>{" "}
                <span className="font-semibold">
                  Rp {pelanggan.abonemen.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Potongan Flat:</span>{" "}
                <span className="font-semibold">
                  Rp {pelanggan.potongan.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Bonus Referral:</span>{" "}
                <span className="font-bold text-blue-400 flex items-center gap-1">
                  + Rp {referralDiscountValue.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 mt-2">
                <span className="text-blue-300 font-bold">Total Diskon:</span>{" "}
                <span className="font-black text-blue-400">
                  Rp {totalDiscount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tunggakan:</span>{" "}
                <span className="font-semibold">
                  Rp
                  {pelanggan.invoices
                    .reduce(
                      (total, { amount, status }) =>
                        status === "PAID" ? total : total + amount,
                      0,
                    )
                    .toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6 border-t border-slate-800 pt-6">
              <button
                onClick={() => setEditingUser(pelanggan)}
                className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-md"
              >
                <Edit size={14} /> Edit
              </button>
              <button
                onClick={() =>
                  handleUpdateStatus(
                    pelanggan.id,
                    pelanggan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  )
                }
                disabled={isPending}
                className={`w-full flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md ${
                  pelanggan.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : pelanggan.status === "ACTIVE" ? (
                  <UserX size={14} />
                ) : (
                  <UserCheck size={14} />
                )}
                <span>
                  {pelanggan.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
                </span>
              </button>
              {unpaidInvoices.length > 0 && (
                <button
                  onClick={() => setIsReminderModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-md"
                >
                  <BellRing size={14} /> Kirim Pengingat Tagihan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- KOLOM KANAN: TABEL TAGIHAN & KELUHAN --- */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-lg border border-slate-800">
            {/* Navigasi Tab */}
            <div className="flex border-b border-slate-800">
              <button
                onClick={() => setActiveTab("tagihan")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold ${
                  activeTab === "tagihan"
                    ? "border-b-2 border-blue-500 text-white"
                    : "text-gray-400 font-medium hover:text-gray-200 transition-colors"
                }`}
              >
                <FileText size={16} /> Riwayat Tagihan
              </button>
              <button
                onClick={() => setActiveTab("router")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold ${
                  activeTab === "router"
                    ? "border-b-2 border-cyan-500 text-white"
                    : "text-gray-400 font-medium hover:text-gray-200 transition-colors"
                }`}
              >
                <Cpu size={16} /> Router
              </button>
              <button
                onClick={() => setActiveTab("keluhan")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold ${
                  activeTab === "keluhan"
                    ? "border-b-2 border-blue-500 text-white"
                    : "text-gray-400 font-medium hover:text-gray-200 transition-colors"
                }`}
              >
                <MessageSquareWarning size={16} /> Riwayat Keluhan
              </button>
              <button
                onClick={() => setActiveTab("referral")}
                className={`flex items-center gap-2 px-6 py-3 font-semibold ${
                  activeTab === "referral"
                    ? "border-b-2 border-pink-500 text-white"
                    : "text-gray-400 font-medium hover:text-gray-200 transition-colors"
                }`}
              >
                <UserCheck size={16} /> Referral
              </button>
            </div>

            {/* Konten Tab */}
            <div className="p-6">
              {activeTab === "tagihan" && (
                <TabelTagihan
                  invoices={pelanggan.invoices}
                  updateAction={updateInvoiceStatusAction}
                  router={router}
                  pelanggan={pelanggan}
                />
              )}
              {activeTab === "router" && (
                <DeviceAssociation
                  userId={pelanggan.id}
                  linkedDevices={linkedDevices}
                  unlinkedDevices={unlinkedDevices}
                  linkAction={linkGenieACSDeviceAction}
                  unlinkAction={unlinkGenieACSDeviceAction}
                  renameAction={renameGenieACSDeviceAction}
                  rebootAction={rebootGenieACSDeviceAction}
                  refreshAction={refreshGenieACSDeviceAction}
                  changePasswordAction={changeWifiPasswordAction}
                />
              )}
              {activeTab === "keluhan" && (
                <TabelKeluhan
                  complaints={pelanggan.complaints}
                  updateAction={updateComplaintStatusAction}
                />
              )}
              {activeTab === "referral" && (
                <ReferralTab
                  referrals={pelanggan.referralsMade}
                  month={currentMonth}
                  year={currentYear}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold">Edit Data Pelanggan</h3>
            </div>
            <form
              ref={editFormRef}
              action={(formData) => handleFormSubmit(formData)}
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
      {isReminderModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-lg border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold">
                Konfirmasi Pengingat Tagihan
              </h3>
              <p className="text-sm text-gray-400">
                Notifikasi akan dikirim ke {pelanggan.name} ({pelanggan.phone}
                ).
              </p>
            </div>
            <div className="p-6">
              <p className="mb-4 font-semibold">
                Ringkasan Tagihan Tertunggak:
              </p>
              <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-md p-4 bg-slate-950/50 space-y-2">
                {unpaidInvoices.map((inv) => (
                  <div key={inv.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      Periode{" "}
                      {new Date(0, inv.month - 1).toLocaleString("id-ID", {
                        month: "long",
                      })}{" "}
                      {inv.year}
                    </span>
                    <span className="font-mono">
                      Rp {inv.amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-lg font-bold mt-4 border-t border-slate-700 pt-4">
                <span>TOTAL TAGIHAN</span>
                <span>Rp {totalTunggakan.toLocaleString("id-ID")}</span>
              </div>
            </div>
            <div className="p-6 bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="px-4 py-2 rounded-md hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleSendReminder}
                disabled={isPending}
                className="px-4 py-2 text-white bg-cyan-600 hover:bg-cyan-700 rounded-md flex items-center gap-2"
              >
                {isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <BellRing size={16} />
                )}
                Kirim Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabelTagihan({
  invoices,
  updateAction,
  router,
  pelanggan,
}: {
  invoices: Invoice[];
  updateAction: DetailPelangganClientProps["updateInvoiceStatusAction"];
  router: any;
  pelanggan: PelangganDetail;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-800/50">
            <th className="p-3">Periode</th>
            <th className="p-3">Jumlah</th>
            <th className="p-3">Status</th>
            <th className="p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isDiscounted = inv.amount < pelanggan.abonemen;
            const myBonus =
              pelanggan.abonemen - pelanggan.potongan - inv.amount;

            return (
              <tr key={inv.id} className="border-b border-slate-800">
                <td className="p-3 font-semibold">
                  {monthNames[inv.month]} {inv.year}
                </td>
                <td className="p-3">
                  <div className="font-bold text-white">
                    Rp {inv.amount.toLocaleString("id-ID")}
                  </div>
                  {isDiscounted && (
                    <div className="text-[10px] text-blue-400 font-bold mt-0.5 bg-blue-500/10 inline-block px-1.5 py-0.5 rounded border border-blue-500/20">
                      Diskon: -Rp{" "}
                      {(pelanggan.abonemen - inv.amount).toLocaleString(
                        "id-ID",
                      )}
                    </div>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      inv.status === "PAID"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="p-3">
                  {inv.status === "UNPAID" ? (
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          const toastId = toast.loading("Menandai lunas...");
                          const result = await updateAction(inv.id, "PAID");

                          if (result?.success) {
                            toast.success(result.success, { id: toastId });

                            if (result.pdfUrl) {
                              await triggerPrint(result.pdfUrl);
                            }
                          } else if (result?.error) {
                            toast.error(result.error, { id: toastId });
                          } else if (result?.message) {
                            toast.info(result.message, { id: toastId });
                          }
                        })
                      }
                      disabled={isPending}
                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded disabled:opacity-50"
                    >
                      Tandai Lunas
                    </button>
                  ) : (
                    <PrintButton url={inv.pdfUrl || ""} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabelKeluhan({
  complaints,
  updateAction,
}: {
  complaints: Complaint[];
  updateAction: (complaintId: string, newStatus: ComplaintStatus) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-800/50">
            <th className="p-3">Subjek</th>
            <th className="p-3">Tanggal</th>
            <th className="p-3">Status</th>
            <th className="p-3">Ubah Status</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr key={c.id} className="border-b border-slate-800">
              <td className="p-3 font-semibold" title={c.description}>
                {c.subject}
              </td>
              <td className="p-3">
                {new Date(c.createdAt).toLocaleDateString("id-ID")}
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    c.status === "OPEN"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : c.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {c.status.replace("_", " ")}
                </span>
              </td>
              <td className="p-3">
                <select
                  value={c.status}
                  onChange={(e) =>
                    startTransition(() =>
                      updateAction(c.id, e.target.value as ComplaintStatus),
                    )
                  }
                  disabled={isPending || c.status === "RESOLVED"}
                  className="select-style text-xs py-1"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReferralTab({
  referrals,
  month,
  year,
}: {
  referrals: PelangganDetail["referralsMade"];
  month: number;
  year: number;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-800/50">
              <th className="p-3">Nama Teman</th>
              <th className="p-3">Status Lunas</th>
              <th className="p-3">Tunggakan</th>
              <th className="p-3 text-center">Bonus</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => {
              const referee = r.referee;
              const currentInvoice = referee.invoices.find(
                (inv) => inv.month === month && inv.year === year,
              );
              const hasArrears = referee.invoices.some(
                (inv) => inv.status === "UNPAID",
              );
              const isEligible =
                currentInvoice?.status === "PAID" && !hasArrears;

              return (
                <tr key={r.id} className="border-b border-slate-800">
                  <td className="p-3">
                    <div className="font-bold text-white tracking-tight">
                      {referee.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {referee.idNumber || "REG-PEL"}
                    </div>
                  </td>
                  <td className="p-3">
                    {currentInvoice ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                          currentInvoice.status === "PAID"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {currentInvoice.status === "PAID" ? (
                          <Check size={12} />
                        ) : (
                          <X size={12} />
                        )}
                        {currentInvoice.status === "PAID"
                          ? "LUNAS"
                          : "BELUM LUNAS"}
                      </span>
                    ) : (
                      <span className="text-slate-600 italic text-xs">
                        Belum ada tagihan
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                        !hasArrears
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-red-500/10 text-red-100 border border-red-500/20"
                      }`}
                    >
                      {!hasArrears ? "BERSIH" : "ADA TUNGGAKAN"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {isEligible ? (
                      <span className="text-green-400 font-bold">
                        +Rp 5.000
                      </span>
                    ) : (
                      <span className="text-slate-600 font-bold">Rp 0</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {referrals.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-10 text-center opacity-30 uppercase text-[10px] font-black tracking-widest"
                >
                  Tidak ada data referral
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
