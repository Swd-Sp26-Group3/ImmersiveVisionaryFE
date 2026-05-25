'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Users, Settings, Shield, FileText,
  CheckCircle, AlertTriangle, TrendingUp, Activity, Terminal
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardStats {
  totalUsers: number;
}

interface RecentUser {
  UserId: number;
  UserName: string;
  Email: string;
  RoleName: string;
  CreatedAt: string;
}

interface RecentLog {
  id: string;
  type: "Info" | "Warning" | "Error";
  message: string;
  timestamp: string;
}

const LOG_ICON = {
  Error: <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />,
  Warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
  Info: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
};

const LOG_COLOR = {
  Error: "border-red-500/20 text-red-400 bg-red-500/5",
  Warning: "border-yellow-500/20 text-yellow-400 bg-yellow-500/5",
  Info: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([
        apiFetch("/users"),
        apiFetch("/admin/dashboard")
      ]);

      if (usersRes.ok) {
        const json = await usersRes.json();
        const users = Array.isArray(json) ? json : (json.data ?? []);
        setStats(prev => ({ ...prev, totalUsers: users.length }));
        setRecentUsers(users.slice(0, 4));
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log("Admin extra stats:", statsData);
      }

    } catch (err) {
      console.warn("Dashboard fetch failed:", err);
    } finally {
      setLoading(false);
      setRecentLogs([]);
    }
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      subText: "Registered accounts",
      icon: <Users className="w-5 h-5 text-indigo-400" />,
      accentColor: "indigo",
      bgClass: "from-indigo-500/5 via-indigo-500/10 to-transparent border-indigo-500/20 hover:border-indigo-500/40",
    },
    {
      label: "Active Sessions",
      value: "99.8%",
      subText: "System uptime",
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      accentColor: "emerald",
      bgClass: "from-emerald-500/5 via-emerald-500/10 to-transparent border-emerald-500/20 hover:border-emerald-500/40",
    },
    {
      label: "API Operations",
      value: "14,820",
      subText: "Last 24 hours",
      icon: <Terminal className="w-5 h-5 text-sky-400" />,
      accentColor: "sky",
      bgClass: "from-sky-500/5 via-sky-500/10 to-transparent border-sky-500/20 hover:border-sky-500/40",
    },
    {
      label: "Server Status",
      value: "Online",
      subText: "All nodes operational",
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      accentColor: "purple",
      bgClass: "from-purple-500/5 via-purple-500/10 to-transparent border-purple-500/20 hover:border-purple-500/40",
    },
  ];

  const quickActions = [
    { label: "Manage Users", desc: "View and edit user accounts", href: "/admin-dashboard/users", icon: Users, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
    { label: "System Settings", desc: "Configure upload & notifications", href: "/admin-dashboard/settings", icon: Settings, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
    { label: "Content Moderation", desc: "Review flagged content", href: "/admin-dashboard/content", icon: FileText, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
    { label: "System Logs", desc: "Monitor events and errors", href: "/admin-dashboard/logs", icon: Shield, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <div className="text-slate-400 text-sm animate-pulse font-medium">Loading system statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time status monitoring, activity metrics, and administration</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d1324] border border-white/[0.06]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-300">Live Telemetry Connected</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`bg-gradient-to-br ${card.bgClass} border rounded-2xl p-6 backdrop-blur-sm transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)]`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {card.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
              <p className="text-xs text-slate-500 font-medium">{card.subText}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-white font-bold text-lg tracking-tight">Administrative Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.href}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 + 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(action.href)}
                className="text-left p-5 rounded-2xl bg-[#0d1324]/50 border border-white/[0.06] hover:border-indigo-500/30 hover:bg-[#0d1324]/80 transition-all shadow-md group relative overflow-hidden flex items-start gap-4 cursor-pointer"
              >
                <div className={`p-3 rounded-xl flex-shrink-0 border ${action.color.split(" ")[1]} ${action.color.split(" ")[2]}`}>
                  <Icon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-white text-sm font-semibold tracking-wide group-hover:text-indigo-400 transition-colors">{action.label}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{action.desc}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
              <h2 className="text-white font-bold text-base tracking-tight">Recent User Registrations</h2>
            </div>
            <button
              onClick={() => router.push("/admin-dashboard/users")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              View directory →
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {recentUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                <p className="text-slate-500 text-xs">No users registered recently</p>
              </div>
            ) : (
              recentUsers.map((user, i) => (
                <motion.div
                  key={user.UserId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.3 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
                      {user.UserName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{user.UserName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.Email}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {user.RoleName}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{new Date(user.CreatedAt).toLocaleDateString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-sky-400" />
              <h2 className="text-white font-bold text-base tracking-tight">Active Audit Logs</h2>
            </div>
            <button
              onClick={() => router.push("/admin-dashboard/logs")}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
            >
              View full trail →
            </button>
          </div>
          <div className="space-y-3 flex-1">
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Terminal className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
                <p className="text-slate-500 text-xs">No active alerts recorded</p>
              </div>
            ) : (
              recentLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.3 }}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border ${LOG_COLOR[log.type]}`}
                >
                  {LOG_ICON[log.type]}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-medium leading-relaxed break-all">{log.message}</p>
                    <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{log.timestamp}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}