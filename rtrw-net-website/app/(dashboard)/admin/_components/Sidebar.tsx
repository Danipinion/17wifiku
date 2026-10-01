"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquareWarning,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  LineChart,
  Home,
  Megaphone,
  Briefcase,
  UserCog,
  CheckCircle,
  History,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Send,
  Map as MapIcon,
  Server,
  Activity,
  UserCheck
} from "lucide-react";
import type { Session } from "next-auth";
import { logout } from "../actions";

type NavItem = {
  href?: string;
  label: string;
  icon: any;
  subItems?: { href: string; label: string; icon: any }[];
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Pelayanan",
    icon: Users,
    subItems: [
      { href: "/admin/pelanggan", label: "Pelanggan", icon: Users },
      { href: "/admin/tagihan", label: "Tagihan", icon: FileText },
      { href: "/admin/keluhan", label: "Keluhan", icon: MessageSquareWarning },
      { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
      { href: "/admin/announcement", label: "Pengumuman", icon: Smartphone },
      { href: "/admin/referral", label: "Referral", icon: UserCheck },
    ],
  },
  {
    label: "Teknis",
    icon: Server,
    subItems: [
      { href: "/admin/network-map", label: "Peta Jaringan", icon: MapIcon },
    ],
  },
  {
    label: "Operasional",
    icon: Activity,
    subItems: [
      { href: "/admin/laporan", label: "Statistik & Laporan", icon: LineChart },
    ],
  },
  {
    label: "Manajemen SDM",
    icon: UserCog,
    subItems: [
      { href: "/admin/karyawan", label: "Karyawan", icon: UserCog },
      { href: "/admin/pekerjaan/jenis", label: "Jenis Pekerjaan", icon: Briefcase },
      { href: "/admin/pekerjaan/assign", label: "Penugasan", icon: Send },
      { href: "/admin/pekerjaan/approval", label: "Status & Approval", icon: CheckCircle },
      { href: "/admin/pekerjaan/riwayat", label: "Riwayat Kerja", icon: History },
      { href: "/admin/app-version", label: "Versi Aplikasi", icon: Smartphone },
    ],
  },
  { href: "/", label: "Halaman Utama", icon: Home },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobile: boolean;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean) => void;
  user: Session["user"];
}

export function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobile,
  isMobileOpen,
  setIsMobileOpen,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (label: string) => {
    setOpenMenu(openMenu === label ? null : label);
  };

  const handleToggle = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const sidebarClasses = `
    bg-slate-900 border-r border-slate-800 flex flex-col
    transition-all duration-300 ease-in-out
    ${
      isMobile
        ? `fixed inset-y-0 left-0 z-[5000] w-[90%] sm:w-64 transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`
        : `relative z-[2000] ${isCollapsed ? "w-20" : "w-64"}`
    }
  `;

  return (
    <>
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={sidebarClasses}>
        <div
          className={`flex items-center justify-between p-4 border-b border-slate-800 ${
            isCollapsed && !isMobile ? "h-[69px] justify-center" : ""
          }`}
        >
          {!isCollapsed && (
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-white tracking-tight">Netown</h2>
              <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mt-0.5">Administrator</p>
            </div>
          )}
          <button
            onClick={handleToggle}
            className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600"
          >
            {isMobile ? (
              <X size={18} />
            ) : isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
        </div>

        <nav
          className={`flex-1 p-3 space-y-1.5 overflow-x-hidden ${isCollapsed && !isMobile ? "overflow-y-hidden" : "overflow-y-auto"}`}
          style={{
            scrollbarWidth: isCollapsed && !isMobile ? "none" : "thin",
            msOverflowStyle: isCollapsed && !isMobile ? "none" : "auto",
            scrollbarColor: "#334155 transparent",
          }}
        >
          {navItems.map((item) => {
            const hasSubItems = !!item.subItems;
            const isSubMenuOpen = openMenu === item.label;
            const isActive = item.href
              ? pathname === item.href
              : item.subItems?.some((s) => pathname === s.href);

            if (hasSubItems) {
              return (
                <div key={item.label} className="relative group/menu">
                  <button
                    onClick={() => {
                      toggleMenu(item.label);
                      // REMOVED: Auto-expand sidebar when clicking sub-menu
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive && !isSubMenuOpen
                        ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                    } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                    title={isCollapsed && !isMobile ? item.label : ""}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon
                        size={20}
                        className={
                          isActive ? "text-blue-500" : ""
                        }
                      />
                      {!isCollapsed && <span className="uppercase tracking-wide">{item.label}</span>}
                    </div>
                    {!isCollapsed &&
                      (isSubMenuOpen ? (
                        <ChevronDown size={14} className="text-slate-600" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-600" />
                      ))}
                  </button>

                  {/* Sub-items list: Shows downwards in both modes */}
                  {isSubMenuOpen && (
                    <div className={`${isCollapsed && !isMobile ? "flex flex-col items-center py-1.5 space-y-2 bg-slate-900/50 rounded-xl mt-1 border border-slate-800/50 mx-2" : "ml-5 mt-1 border-l-2 border-slate-800 pl-4 py-1 space-y-1"}`}>
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            onClick={() => isMobile && setIsMobileOpen(false)}
                            className={`flex items-center transition-all ${
                              isCollapsed && !isMobile 
                                ? "p-2 rounded-lg hover:bg-slate-700/50" 
                                : "gap-3 px-3 py-2 rounded-lg text-[11px] font-bold"
                            } ${
                              isSubActive
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                                : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                            }`}
                            title={isCollapsed && !isMobile ? subItem.label : ""}
                          >
                            <subItem.icon size={isCollapsed && !isMobile ? 18 : 14} className={isSubActive ? "text-blue-500" : ""} />
                            {!isCollapsed && <span className="uppercase tracking-tight">{subItem.label}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Floating Sub-items when collapsed: Still show on Hover (Tooltips) */}
                  {isCollapsed && !isMobile && !isSubMenuOpen && (
                    <div 
                      className={`absolute left-full top-0 ml-2 py-2 px-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl transition-all z-[6000] min-w-[200px] 
                      ${isSubMenuOpen 
                        ? "opacity-100 visible translate-x-0" 
                        : "opacity-0 invisible -translate-x-2 group-hover/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-x-0"
                      }`}
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 mb-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />}
                      </div>
                      <div className="space-y-0.5">
                        {item.subItems!.map((subItem) => {
                          const isSubActive = pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-[11px] font-black transition-all ${
                                isSubActive
                                  ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-500 pl-[14px]"
                                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                              }`}
                            >
                              <subItem.icon size={14} className={isSubActive ? "text-blue-500" : "text-slate-500"} />
                              <span className="uppercase tracking-tight">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => isMobile && setIsMobileOpen(false)}
                className={`flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group/link ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
                } ${isCollapsed && !isMobile ? "justify-center" : ""}`}
                title={isCollapsed && !isMobile ? item.label : ""}
              >
                <div className="relative">
                   <item.icon size={20} className={isActive ? "text-white" : "group-hover/link:text-blue-400 transition-colors"} />
                   {isCollapsed && !isMobile && (
                     <div className="absolute left-full ml-6 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[10px] text-white rounded-lg whitespace-nowrap opacity-0 invisible group-hover/link:opacity-100 group-hover/link:visible transition-all shadow-xl z-[6000]">
                       {item.label}
                     </div>
                   )}
                </div>
                {!isCollapsed && <span className="uppercase tracking-wide">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`p-3 border-t border-slate-800 bg-slate-900/50 ${
            isCollapsed && !isMobile ? "items-center" : ""
          }`}
        >
          <div
            className={`${isCollapsed && !isMobile ? "hidden" : "block"} px-2 mb-4`}
          >
            <p className="text-xs font-black text-white uppercase tracking-tight">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Admin Server</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20 ${
                isCollapsed && !isMobile ? "justify-center" : ""
              }`}
              title={isCollapsed || isMobile ? "Logout" : ""}
            >
              <LogOut size={20} />
              {!isCollapsed && <span className="uppercase tracking-widest">Logout</span>}
            </button>
          </form>
        </div>
      </aside>

      {isMobile && !isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-30 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-2xl"
        >
          <PanelLeftOpen size={20} />
        </button>
      )}
    </>
  );
}
