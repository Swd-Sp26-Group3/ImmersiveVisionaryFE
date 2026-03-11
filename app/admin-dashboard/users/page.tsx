'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { AlertCircle, Edit, Loader2, RefreshCw, Search, Trash2, UserPlus } from "lucide-react";

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
  ADMIN: "bg-red-600/80 text-red-100",
  MANAGER: "bg-purple-600/80 text-purple-100",
  ARTIST: "bg-cyan-600/80 text-cyan-100",
  CUSTOMER: "bg-blue-600/80 text-blue-100",
  SELLER: "bg-green-600/80 text-green-100",
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

  // GET /api/users — ADMIN/MANAGER only
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

  // DELETE /api/users/:id — soft delete
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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 text-sm mt-1">{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 border border-slate-600 text-slate-400 rounded-lg hover:text-white hover:border-slate-500 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {/* ✅ Create new user */}
          <button
            onClick={() => router.push("/admin-dashboard/users/create")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-sm font-medium transition"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-cyan-500"
        >
          {roles.map((r) => (
            <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400">No users found.</p>
          {search && (
            <button onClick={() => setSearch("")} className="mt-2 text-sm text-cyan-400 hover:underline">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.UserId}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-blue-500/10 hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.UserName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium text-sm">{user.UserName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_BADGE[user.RoleName] ?? "bg-slate-600 text-white"}`}>
                      {user.RoleName}
                    </span>
                    {user.CompanyName && (
                      <span className="text-xs text-slate-500 truncate">• {user.CompanyName}</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{user.Email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <span className="text-xs text-slate-500 hidden md:block">
                  #{user.UserId}
                </span>
                {/* Edit → UserDetailPage */}
                <button
                  onClick={() => router.push(`/admin-dashboard/users/${user.UserId}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/10 transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                {/* Ban — soft delete */}
                <button
                  onClick={() => handleBan(user.UserId, user.UserName)}
                  disabled={deletingId === user.UserId || user.RoleName === "ADMIN"}
                  title={user.RoleName === "ADMIN" ? "Cannot ban ADMIN" : "Ban user"}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deletingId === user.UserId
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                  Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && users.length > 0 && (
        <div className="mt-6 flex gap-3 flex-wrap">
          {Object.entries(
            users.reduce((acc, u) => {
              acc[u.RoleName] = (acc[u.RoleName] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([role, count]) => (
            <div key={role} className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-xs">
              <span className={`font-medium ${ROLE_BADGE[role]?.split(" ")[1] ?? "text-white"}`}>{role}</span>
              <span className="text-slate-400 ml-2">{count} user{count !== 1 ? "s" : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}