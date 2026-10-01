import { getPaginatedAnnouncements } from "../actions";
import { AnnouncementClient } from "../_components/AnnouncementClient"

export default async function AnnouncementPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; type?: string };
}) {
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const q = searchParams.q || "";
  const type = searchParams.type || "ALL";

  const { data, total, totalPages, currentPage } = await getPaginatedAnnouncements({
    page,
    search: q,
    type,
    limit: 8,
  });

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">PENGUMUMAN & PROMO</h1>
        <p className="text-slate-400">Atur pesan, informasi urgent, dan promo terbaru untuk muncul di website dan aplikasi pelanggan.</p>
      </div>

      <AnnouncementClient 
        initialData={data} 
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        searchQuery={q}
        type={type}
      />
    </div>
  );
}
