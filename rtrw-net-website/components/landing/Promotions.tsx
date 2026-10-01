// components/landing/Promotions.tsx
import prisma from "@/lib/prisma";
import { Megaphone, Bell, Info, ArrowRight, Clock } from "lucide-react";
import { CountdownTimer } from "../common/CountdownTimer";

export default async function Promotions() {
  const now = new Date();
  
  const announcements = await prisma.announcement.findMany({
    where: { 
      isActive: true,
      startDate: { lte: now }, // Sudah mulai tayang
      OR: [
        { endDate: null },
        { endDate: { gte: now } } // Belum expired
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 3, // Tampilkan maksimal 3 pengumuman terbaru
  });

  if (announcements.length === 0) return null;

  return (
    <section className="py-24 bg-slate-900 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] -ml-64 -mb-64" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-blue-500 font-bold tracking-[0.2em] uppercase text-sm mb-4">
            Informasi Terkini
          </h2>
          <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Berita & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Promo Menarik</span>
          </h3>
          <p className="mt-4 text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Dapatkan update terbaru mengenai layanan kami, perbaikan berkala, serta berbagai penawaran spesial yang tidak boleh Anda lewatkan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {announcements.map((promo) => (
            <div 
              key={promo.id}
              className={`group flex flex-col h-full bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 transition-all duration-500 hover:bg-slate-800/60 hover:-translate-y-2 hover:shadow-2xl ${
                promo.isUrgent ? "hover:border-red-500/40 shadow-red-500/5" : "hover:border-blue-500/40 shadow-blue-500/5"
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${promo.isUrgent ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`}>
                  {promo.isUrgent ? <Bell className="animate-pulse" size={24} /> : <Megaphone size={24} />}
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-700/50">
                  {new Date(promo.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <div className="flex-grow">
                <h4 className={`text-2xl font-bold mb-4 group-hover:text-white transition-colors ${promo.isUrgent ? "text-red-400" : "text-white"}`}>
                  {promo.title}
                </h4>
                <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  {promo.content}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-700/50 flex flex-col gap-3">
                {promo.endDate && (
                   <CountdownTimer 
                    targetDate={promo.endDate} 
                    className={promo.isUrgent ? "text-red-400" : "text-blue-400"}
                  />
                )}
                <div className="flex justify-between items-center">
                  <span className={`text-[10px] uppercase font-black tracking-widest ${promo.isUrgent ? "text-red-500" : "text-blue-500"}`}>
                    {promo.isUrgent ? "Penting / Urgent" : promo.type}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
