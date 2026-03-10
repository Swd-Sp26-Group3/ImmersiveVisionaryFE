'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Settings, FileText, Shield, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/admin-dashboard",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/admin-dashboard/users",    label: "Manage Users", icon: Users },
  { href: "/admin-dashboard/settings", label: "System Config", icon: Settings },
  { href: "/admin-dashboard/content",  label: "Content Mod",  icon: FileText },
  { href: "/admin-dashboard/logs",     label: "System Logs",  icon: Shield },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[#0a0f1e]">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/80 border-r border-blue-500/20 p-4 flex flex-col gap-2">
        <div className="text-white font-bold text-xl mb-6 px-2">⚙ Admin Panel</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}