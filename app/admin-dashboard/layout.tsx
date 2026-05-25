'use client';
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, FileText, Shield, LayoutDashboard, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="flex h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] overflow-hidden bg-[#080d1a] relative">
      
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-16 md:top-20 bottom-0 z-40 w-64 bg-[#0d1324]/85 backdrop-blur-md border-r border-white/[0.06] p-4 flex flex-col gap-2 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-full ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8 px-2 mt-2">
          <div className="text-white font-bold text-lg flex items-center gap-3">
            <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Shield className="w-4 h-4 text-white" />
            </span>
            <div className="flex flex-col">
              <span className="leading-tight tracking-wide">Admin Panel</span>
              <span className="text-[10px] text-indigo-400 font-medium">Control Center</span>
            </div>
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
                className="relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium group text-sm"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border-l-2 border-indigo-500 rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-white transition-colors"}`} />
                <span className={`relative z-10 ${isActive ? "text-white font-semibold" : "text-slate-400 group-hover:text-white transition-colors"}`}>
                  {item.label}
                </span>
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

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}