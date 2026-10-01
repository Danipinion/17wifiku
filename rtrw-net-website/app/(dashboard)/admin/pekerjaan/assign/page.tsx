"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, FileText, Send, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Employee {
  id: string;
  name: string;
}

interface JobType {
  id: string;
  name: string;
}

export default function AssignJobPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    jobTypeId: "",
    instruction: "",
    targetLatitude: "",
    targetLongitude: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, typeRes] = await Promise.all([
          fetch("/api/admin/employees"),
          fetch("/api/admin/job-types"),
        ]).catch(() => [null, null]);

        if (!empRes?.ok || !typeRes?.ok)
          throw new Error("Gagal mengambil data");

        const [empData, typeData] = await Promise.all([
          empRes.json(),
          typeRes.json(),
        ]);

        setEmployees(empData);
        setJobTypes(typeData);
      } catch (error) {
        toast.error("Gagal memuat data pendukung");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation tidak didukung oleh browser ini");
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          targetLatitude: position.coords.latitude.toString(),
          targetLongitude: position.coords.longitude.toString(),
        }));
        setIsGettingLocation(false);
        toast.success("Lokasi berhasil diambil");
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Error getting location:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Izin akses lokasi ditolak");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Informasi lokasi tidak tersedia");
            break;
          case error.TIMEOUT:
            toast.error("Waktu permintaan lokasi habis");
            break;
          default:
            toast.error("Terjadi kesalahan saat mengambil lokasi");
        }
      },
      { enableHighAccuracy: true },
    );
  };

  useEffect(() => {
    // Automatically try to get location on mount
    handleGetCurrentLocation();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.jobTypeId) {
      toast.error("Mohon pilih karyawan dan tipe pekerjaan");
      return;
    }

    setSubmitting(true);
    try {
      let adminPhotoUrl = "";
      if (photo) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", photo);
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });
        if (!uploadRes.ok) throw new Error("Gagal mengunggah foto");
        const uploadData = await uploadRes.json();
        adminPhotoUrl = uploadData.url;
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          adminPhoto: adminPhotoUrl,
          targetLatitude: formData.targetLatitude
            ? parseFloat(formData.targetLatitude)
            : null,
          targetLongitude: formData.targetLongitude
            ? parseFloat(formData.targetLongitude)
            : null,
          status: "TODO",
          date: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Gagal menugaskan pekerjaan");

      toast.success("Pekerjaan berhasil ditugaskan!");
      setFormData({
        userId: "",
        jobTypeId: "",
        instruction: "",
        targetLatitude: "",
        targetLongitude: "",
      });
      setPhoto(null);
      setPhotoPreview(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Tugaskan Pekerjaan</h1>
        <p className="text-gray-400">
          Admin menugaskan pekerjaan untuk karyawan/teknisi
        </p>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employee Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <User size={16} className="text-blue-400" />
              Pilih Karyawan
            </label>
            <select
              required
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="">Pilih Karyawan...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job Type Selection */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Briefcase size={16} className="text-blue-400" />
              Tipe Pekerjaan
            </label>
            <select
              required
              value={formData.jobTypeId}
              onChange={(e) =>
                setFormData({ ...formData, jobTypeId: e.target.value })
              }
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="">Pilih Tipe Pekerjaan...</option>
              {jobTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <FileText size={16} className="text-blue-400" />
              Instruksi / Detail Tugas
            </label>
            <textarea
              placeholder="Berikan detail tugas (misal: Alamat lengkap, no telp pelanggan, atau kendala yang dilaporkan)"
              value={formData.instruction}
              onChange={(e) =>
                setFormData({ ...formData, instruction: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px] transition-all"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <FileText size={16} className="text-blue-400" />
              Foto Referensi (Opsional)
            </label>
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all"
              />
              {photoPreview && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-800">
                  <Image
                    src={photoPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600 p-1 rounded-full text-white hover:bg-red-700 transition-all"
                  >
                    <Briefcase size={16} />{" "}
                    {/* Use appropriate icon for delete, Briefcase is just a placeholder here */}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <MapPin size={16} className="text-blue-400" />
                Lokasi Target (Opsional)
              </label>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-full transition-all border border-blue-500/30"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Mengambil...
                  </>
                ) : (
                  <>
                    <MapPin size={12} />
                    Ambil Lokasi Saat Ini
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 ml-1">Latitude</label>
                <input
                  type="text"
                  placeholder="-6.175392"
                  value={formData.targetLatitude}
                  onChange={(e) =>
                    setFormData({ ...formData, targetLatitude: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all sm:text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-400 ml-1">Longitude</label>
                <input
                  type="text"
                  placeholder="106.827153"
                  value={formData.targetLongitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      targetLongitude: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all sm:text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              * Tips: Ambil otomatis dengan tombol di atas atau ambil koordinat
              dari Google Maps.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Kirim Tugas ke Karyawan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
