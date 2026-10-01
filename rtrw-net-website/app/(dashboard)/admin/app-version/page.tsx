"use client";

import { useState, useEffect } from "react";
import { Upload, Save, Loader2, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AppVersionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<any>(null);

  const [formData, setFormData] = useState({
    versionCode: "",
    versionName: "",
    releaseNotes: "",
    forceUpdate: false,
    appType: "CUSTOMER", // CUSTOMER or EMPLOYEE
  });

  const [file, setFile] = useState<File | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchCurrentVersion(formData.appType);
  }, [formData.appType]);

  const fetchCurrentVersion = async (type: string) => {
    try {
      setLoading(true);
      setCurrentVersion(null); // Clear previous state to avoid mixup
      const res = await fetch(`/api/admin/app-version?appType=${type}`);
      const data = await res.json();
      if (data && data.versionCode) {
        setCurrentVersion(data);
        setFormData({
          versionCode: (data.versionCode + 1).toString(),
          versionName: data.versionName,
          releaseNotes: "",
          forceUpdate: false,
          appType: type,
        });
      }
    } catch (error) {
      toast.error("Gagal memuat versi aplikasi saat ini");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVersion && !file) {
      toast.error("File APK wajib diunggah untuk versi pertama!");
      return;
    }

    setSaving(true);
    const payload = new FormData();
    payload.append("versionCode", formData.versionCode);
    payload.append("versionName", formData.versionName);
    payload.append("appType", formData.appType);
    payload.append("forceUpdate", String(formData.forceUpdate));
    payload.append("releaseNotes", formData.releaseNotes);
    if (file) {
      payload.append("apkFile", file);
    }

    try {
      const res = await fetch("/api/admin/app-version", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        throw new Error((await res.text()) || "Gagal menyimpan versi");
      }

      toast.success("Versi aplikasi berhasil diperbarui!");
      setFile(null);
      fetchCurrentVersion(formData.appType);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Versi Aplikasi</h1>
          <p className="text-gray-400">
            Kelola rilis dan pembaruan untuk aplikasi SobatWiff (Pelanggan) dan Lapor Pak! (Karyawan)
          </p>
        </div>
      </div>

      {/* App Type Tabs */}
      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setFormData({ ...formData, appType: "CUSTOMER" })}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            formData.appType === "CUSTOMER"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Layanan Pelanggan (SobatWiff)
        </button>
        <button
          onClick={() => setFormData({ ...formData, appType: "EMPLOYEE" })}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            formData.appType === "EMPLOYEE"
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Aplikasi Karyawan (Lapor Pak!)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Version Card */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="text-blue-500" size={24} />
            Versi Aktif Saat Ini
          </h2>

          {loading ? (
            <div className="flex-1 flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : currentVersion ? (
            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-gray-400">Version Name</span>
                <span className="font-medium bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                  {formData.appType === "CUSTOMER" ? "SobatWiff" : "Lapor Pak!"} v{currentVersion.versionName}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-gray-400">Version Code</span>
                <span className="text-white font-medium">
                  {currentVersion.versionCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-800">
                <span className="text-gray-400">Force Update</span>
                <span
                  className={`font-medium ${currentVersion.forceUpdate ? "text-red-400" : "text-green-400"}`}
                >
                  {currentVersion.forceUpdate ? "Wajib" : "Opsional"}
                </span>
              </div>
              <div className="py-3 border-b border-slate-800 flex flex-col gap-2">
                <span className="text-gray-400">Release Notes</span>
                <p className="text-white text-sm whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {currentVersion.releaseNotes || "Tidak ada catatan rilis."}
                </p>
              </div>
              {currentVersion.downloadUrl && (
                <div className="pt-4 mt-auto">
                  <a
                    href={currentVersion.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <Download size={18} />
                    Download APK Versi Ini
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-400">
                Belum ada versi aplikasi yang dirilis.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Silakan unggah APK pertama Anda di form sebelah.
              </p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <h2 className="text-xl font-bold text-white mb-6">
            Upload Rilis {formData.appType === "CUSTOMER" ? "SobatWiff" : "Lapor Pak!"} Baru
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Version Code (ID)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.versionCode}
                  onChange={(e) =>
                    setFormData({ ...formData, versionCode: e.target.value })
                  }
                  placeholder="Contoh: 3"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Harus lebih besar dari versi sebelumnya.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Version Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.versionName}
                  onChange={(e) =>
                    setFormData({ ...formData, versionName: e.target.value })
                  }
                  placeholder="Contoh: 1.1.0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Catatan Rilis (Release Notes)
              </label>
              <textarea
                value={formData.releaseNotes}
                onChange={(e) =>
                  setFormData({ ...formData, releaseNotes: e.target.value })
                }
                placeholder="Fitur baru, perbaikan bug, dll..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 min-h-[100px]"
              />
            </div>

            <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={formData.forceUpdate}
                onChange={(e) =>
                  setFormData({ ...formData, forceUpdate: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded bg-slate-900 border-slate-700 focus:ring-blue-600 focus:ring-offset-slate-900"
              />
              <div>
                <p className="text-white font-medium text-sm">
                  Wajib Update (Force Update)
                </p>
                <p className="text-xs text-gray-500">
                  Pengguna tidak akan bisa menggunakan aplikasi sebelum
                  melakukan update.
                </p>
              </div>
            </label>

            <div>
              <label className="flex text-sm font-medium text-gray-400 mb-1 justify-between">
                <span>File APK</span>
                {currentVersion && (
                  <span className="text-gray-500 text-xs">
                    (Opsional jika hanya ganti nama/catatan)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".apk"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="apk-upload"
                />
                <label
                  htmlFor="apk-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-950/50 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    {file ? (
                      <p className="mb-2 text-sm text-green-400 font-medium">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ) : (
                      <>
                        <p className="mb-2 text-sm text-gray-400">
                          <span className="font-semibold text-blue-400">
                            Klik untuk upload
                          </span>{" "}
                          APK Rilis
                        </p>
                        <p className="text-xs text-gray-500">Maksimal 100MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? "Menyimpan Rilis..." : "Simpan & Rilis"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
