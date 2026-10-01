// app/(dashboard)/admin/_components/TagihanTerbaru.tsx
import Link from "next/link";

export function TagihanTerbaru({ tagihan }: { tagihan: any[] }) {
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

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <h2 className="text-xl font-bold mb-4">Tagihan Terbaru (Unpaid)</h2>
      <div className="space-y-3">
        {tagihan.length > 0 ? (
          tagihan.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-semibold text-white">{t.user.name}</p>
                <p className="text-xs text-gray-400">
                  Periode {monthNames[t.month]} {t.year}
                </p>
              </div>
              <span className="font-semibold text-red-400">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(t.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Tidak ada tagihan belum lunas.
          </p>
        )}
      </div>
      <Link
        href="/admin/tagihan"
        className="text-blue-400 hover:underline text-xs mt-4 block text-center"
      >
        Lihat Semua Tagihan
      </Link>
    </div>
  );
}
