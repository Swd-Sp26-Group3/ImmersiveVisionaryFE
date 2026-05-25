'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AlertCircle, AlertTriangle, Edit, Loader2, RefreshCw, Search, Trash2, UserPlus, UserCheck } from "lucide-react";
import { motion } from "motion/react";

interface User {
  UserId: number;
  UserName: string;
  Email: string;
  RoleName: string;
  Phone: string | null;
  CompanyName: string | null;
  CreatedAt: string;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  MANAGER: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  ARTIST: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  CUSTOMER: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  SELLER: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 25 } }
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => { 
    fetchUsers(); 
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/users");
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setUsers(Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      console.error("fetchUsers failed:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (userId: number, userName: string) => {
    if (!confirm(`Ban user "${userName}"? They will no longer be able to log in.`)) return;
    setDeletingId(userId);
    try {
      const res = await apiFetch(`/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.UserId !== userId));
    } catch {
      alert("Failed to ban user.");
    } finally {
      setDeletingId(null);
    }
  };

  const roles = ["ALL", ...Array.from(new Set(users.map((u) => u.RoleName)))];

  const filtered = users.filter((u) => {
    const matchSearch =
      u.UserName.toLowerCase().includes(search.toLowerCase()) ||
      u.Email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.RoleName === roleFilter;
    return matchSearch && matchRole;
  });

  const unassignedCustomers = users.filter((u) => u.RoleName === "CUSTOMER" && !u.CompanyName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Administration</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} active platform accounts registered</p>
        </div>
        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchUsers}
            disabled={loading}
            className="p-2.5 border border-white/[0.08] text-slate-400 rounded-xl hover:text-white hover:bg-white/[0.03] transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/admin-dashboard/users/create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white rounded-xl text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </motion.button>
        </div>
      </div>

      {/* Unassigned Users Alert */}
      {!loading && unassignedCustomers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-300 font-bold text-sm">Action Required: Unassigned Customers</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                There {unassignedCustomers.length === 1 ? "is" : "are"} {unassignedCustomers.length} customer account{unassignedCustomers.length === 1 ? "" : "s"} missing a company assignment. They cannot place orders until assigned to a company.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setSearch(""); setRoleFilter("CUSTOMER"); }}
            className="self-start md:self-auto text-xs px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl transition-all cursor-pointer font-semibold shrink-0"
          >
            Filter List
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1324]/50 border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-500 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#0d1324]/50 border border-white/[0.06] text-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer"
        >
          {roles.map((r) => (
            <option key={r} value={r} className="bg-slate-900 text-white">{r === "ALL" ? "All Roles" : r}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-slate-400 text-sm font-medium animate-pulse">Loading directory entries...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#0d1324]/20 border border-dashed border-white/[0.06] rounded-2xl">
          <AlertCircle className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm font-medium">No users found matching filters.</p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-semibold cursor-pointer">
              Clear search query
            </button>
          )}
        </div>
      ) : (
        <div className="max-h-[480px] overflow-y-auto pr-2">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filtered.map((user) => (
              <motion.div
                key={user.UserId}
                variants={itemVariants}
                whileHover={{ y: -1, scale: 1.002 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl bg-[#0d1324]/40 border border-white/[0.05] hover:border-indigo-500/20 hover:bg-[#0d1324]/60 transition-all gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-extrabold text-sm flex-shrink-0">
                    {user.UserName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-white font-semibold text-sm tracking-wide">{user.UserName}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_BADGE[user.RoleName] ?? "bg-slate-600/10 text-slate-300 border-slate-500/20"}`}>
                        {user.RoleName}
                      </span>
                      {user.CompanyName ? (
                        <span className="text-xs text-slate-500 font-medium truncate">/ {user.CompanyName}</span>
                      ) : user.RoleName === "CUSTOMER" ? (
                        <span className="text-[9px] font-bold flex items-center gap-1 text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded-full border border-amber-400/20">
                          <AlertCircle className="w-3 h-3" /> Assign Company
                        </span>
                      ) : null}
                    </div>
                    <p className="text-slate-400 text-xs font-medium">{user.Email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 ml-0 sm:ml-4 flex-shrink-0 border-t border-white/[0.04] sm:border-0 pt-3 sm:pt-0">
                  <span className="text-xs text-slate-600 font-bold mr-1 hidden md:block">
                    ID: #{user.UserId}
                  </span>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/admin-dashboard/users/${user.UserId}`)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/[0.08] hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 rounded-xl bg-white/[0.01] hover:bg-indigo-500/5 transition-all cursor-pointer font-semibold"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Details
                  </motion.button>
                  
                  <motion.button
                    whileHover={user.RoleName !== "ADMIN" ? { scale: 1.02 } : {}}
                    whileTap={user.RoleName !== "ADMIN" ? { scale: 0.98 } : {}}
                    onClick={() => handleBan(user.UserId, user.UserName)}
                    disabled={deletingId === user.UserId || user.RoleName === "ADMIN"}
                    title={user.RoleName === "ADMIN" ? "Cannot ban system ADMIN" : "Ban account"}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-white/[0.08] hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl bg-white/[0.01] hover:bg-rose-500/5 transition-all cursor-pointer font-semibold disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:border-white/[0.08] disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {deletingId === user.UserId
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                    Ban User
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Summary */}
      {!loading && users.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-4 flex gap-3 flex-wrap border-t border-white/[0.06]"
        >
          {Object.entries(
            users.reduce((acc, u) => {
              acc[u.RoleName] = (acc[u.RoleName] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([role, count]) => (
            <div key={role} className="bg-[#0d1324]/40 border border-white/[0.05] rounded-xl px-3.5 py-2 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="font-semibold text-slate-300">{role}:</span>
              <span className="text-slate-400 font-bold">{count}</span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}