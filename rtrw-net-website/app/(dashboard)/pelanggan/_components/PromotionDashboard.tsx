// app/(dashboard)/pelanggan/_components/PromotionDashboard.tsx
import prisma from "@/lib/prisma";
import { Megaphone, Bell, Sparkles, ArrowRight } from "lucide-react";
import { CountdownTimer } from "@/components/common/CountdownTimer";

export async function PromotionDashboard() {
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
    take: 2, // Ambil 2 info terbaru untuk dashboard
  });

  if (announcements.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-blue-400" size={18} />
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Update Untukmu</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((promo) => (
          <div 
            key={promo.id}
            className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
              promo.isUrgent 
                ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" 
                : "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
            }`}
          >
            {/* Background pattern */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] -mr-12 -mt-12 opacity-20 ${promo.isUrgent ? 'bg-red-500' : 'bg-blue-500'}`} />
            
            <div className="flex gap-4 relative z-10">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${promo.isUrgent ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
                {promo.isUrgent ? <Bell className="animate-pulse" size={20} /> : <Megaphone size={20} />}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {promo.title}
                  </h3>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">
                    {new Date(promo.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                  {promo.content}
                </p>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-slate-500 opacity-60">
                    <span>{promo.type}</span>
                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                  {promo.endDate && (
                    <CountdownTimer 
                      targetDate={promo.endDate} 
                      className={promo.isUrgent ? "text-red-400" : "text-blue-400"}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
