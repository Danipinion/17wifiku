"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  LifeBuoy,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/auth";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/bills", label: "Billing & Invoices", icon: CreditCard },
  { href: "/support", label: "Help Center", icon: LifeBuoy },
  { href: "/profile", label: "My Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-slate-900 text-slate-50 md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 shadow-2xl z-50 transition-all duration-300">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 px-6 bg-slate-950 shadow-sm border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">N</span>
            </div>
            <span className="font-bold text-xl tracking-tight">Nionify</span>
          </div>
        </div>
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  {item.label}
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20 rounded-l-full" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Settings
            </p>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
              <Settings className="w-4 h-4" />
              Preferences
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800/50 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
              user
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                My Account
              </p>
              <p className="text-xs text-slate-500 truncate">
                Manage subscription
              </p>
            </div>
          </div>
          <form action={logout}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
