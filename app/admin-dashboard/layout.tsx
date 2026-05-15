'use client';
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, FileText, Shield, LayoutDashboard, Menu, X } from "lucide-react";

const navItems = [
  { href: "/admin-dashboard",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin-dashboard/users",    label: "Manage Users", icon: Users },
  { href: "/admin-dashboard/settings", label: "System Config", icon: Settings },
  { href: "/admin-dashboard/content",  label: "Content Mod",  icon: FileText },
  { href: "/admin-dashboard/logs",     label: "System Logs",  icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] bg-[#080d1a] relative">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-blue-500/20 p-4 flex flex-col gap-2 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-auto ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="text-white font-bold text-xl flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </span>
            Admin Panel
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-200" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-white truncate text-sm">
            {navItems.find(i => i.href === pathname)?.label || "Admin"}
          </span>
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}