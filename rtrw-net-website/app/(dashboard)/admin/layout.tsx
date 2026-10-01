// app/(dashboard)/admin/layout.tsx
"use client"; // <-- JADIKAN CLIENT COMPONENT

import { useState } from "react";
import { useWindowSize } from "@/hooks/useWindowSize";
import { Sidebar } from "./_components/Sidebar";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NotificationListener } from "./_components/NotificationListener";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { width } = useWindowSize();
  const isMobile = width ? width < 768 : false;

  // State untuk sidebar di desktop (expanded vs collapsed)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // State untuk sidebar di mobile (overlay open vs closed)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menangani loading dan user yang tidak diizinkan
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const sidebarProps = {
    isCollapsed,
    setIsCollapsed,
    isMobile,
    isMobileOpen,
    setIsMobileOpen,
    user: session.user,
  };

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar {...sidebarProps} />
      <NotificationListener />

      <main className={`flex-1 transition-all duration-300 ease-in-out ml-0`}>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
