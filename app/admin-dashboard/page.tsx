'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Users, Settings, Shield, FileText,
  CheckCircle, AlertTriangle, TrendingUp
} from "lucide-react";

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
  Info: <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />,
};

const LOG_COLOR = {
  Error: "border-red-500/20 text-red-400",
  Warning: "border-yellow-500/20 text-yellow-400",
  Info: "border-blue-500/20 text-blue-400",
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
        // Assuming the backend eventually returns more stats, we merge them here
        // For now adminController.getDashboardStats only returns a message
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
      subColor: "text-green-400",
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      gradient: "from-blue-600/20 to-cyan-600/20 border-blue-500/30",
    },
    {
      label: "Active Sessions",
      subColor: "text-gray-400",
      icon: <Shield className="w-5 h-5 text-green-400" />,
      gradient: "from-green-600/20 to-emerald-600/20 border-green-500/30",
    },
    {
      label: "Storage Used",
      subColor: "text-yellow-400",
      icon: <FileText className="w-5 h-5 text-blue-400" />,
      gradient: "from-yellow-600/20 to-orange-600/20 border-yellow-500/30",
    },
    {
      label: "System Health",
      subColor: "text-green-400",
      icon: <TrendingUp className="w-5 h-5 text-green-400" />,
      gradient: "from-purple-600/20 to-pink-600/20 border-purple-500/30",
    },
  ];

  // Quick action cards
  const quickActions = [
    { label: "Manage Users", desc: "View and edit user accounts", href: "/admin-dashboard/users", icon: Users },
    { label: "System Settings", desc: "Configure upload & notifications", href: "/admin-dashboard/settings", icon: Settings },
    { label: "Content Moderation", desc: "Review flagged content", href: "/admin-dashboard/content", icon: FileText },
    { label: "System Logs", desc: "Monitor events and errors", href: "/admin-dashboard/logs", icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">System administration and configuration</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label}
            className={`bg-gradient-to-br ${card.gradient} border rounded-xl p-5 backdrop-blur`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-400">{card.label}</p>
              {card.icon}
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-white font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="text-left p-4 rounded-xl bg-slate-800/50 border border-blue-500/20 hover:border-cyan-500/40 hover:bg-slate-700/50 transition-all group"
              >
                <Icon className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white text-sm font-medium">{action.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{action.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Recent Users + Recent Logs */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Recent Users */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Users</h2>
            <button
              onClick={() => router.push("/admin-dashboard/users")}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No users found
              </p>
            ) : (
              recentUsers.map(user => (
                <div key={user.UserId}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/10">
                  <div>
                    <p className="text-white text-sm font-medium">{user.UserName}</p>
                    <p className="text-xs text-gray-500">{user.Email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-400 border border-blue-500/30">
                      {user.RoleName}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{user.CreatedAt}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Logs */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Recent Logs</h2>
            <button
              onClick={() => router.push("/admin-dashboard/logs")}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {recentLogs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">
                No logs available
              </p>
            ) : (
              recentLogs.map(log => (
                <div key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border ${LOG_COLOR[log.type].split(" ")[0]}`}>
                  {LOG_ICON[log.type]}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{log.message}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{log.timestamp}</p>
                  </div>
                  <span className={`text-xs shrink-0 ${LOG_COLOR[log.type].split(" ")[1]}`}>
                    {log.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}