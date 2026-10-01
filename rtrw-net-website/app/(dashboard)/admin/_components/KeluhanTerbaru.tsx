// app/(dashboard)/admin/_components/KeluhanTerbaru.tsx
import Link from "next/link";

export function KeluhanTerbaru({ keluhan }: { keluhan: any[] }) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <h2 className="text-xl font-bold mb-4">Keluhan Terbaru (Open)</h2>
      <div className="space-y-3">
        {keluhan.length > 0 ? (
          keluhan.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-semibold text-white">{k.subject}</p>
                <p className="text-xs text-gray-400">oleh {k.user.name}</p>
              </div>
              <Link
                href="/admin/keluhan"
                className="text-blue-400 hover:underline text-xs"
              >
                Lihat
              </Link>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Tidak ada keluhan terbuka.
          </p>
        )}
      </div>
    </div>
  );
}
