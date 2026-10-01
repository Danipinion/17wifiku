import { verifySession } from "@/lib/dal";
import { Sidebar } from "@/components/modules/layout/sidebar";
import { BottomNav } from "@/components/modules/layout/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await verifySession();

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <main className="flex-1 pb-16 md:pb-0 md:pl-64">
        <div className="container mx-auto max-w-5xl p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
