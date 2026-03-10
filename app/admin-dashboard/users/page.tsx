'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface User {
  UserId: number;
  UserName: string;
  Email: string;
  RoleName: string;
  Phone: string | null;
  CreatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

const fetchUsers = async () => {
    try {
        const res = await apiFetch("/users");
        if (!res.ok) throw new Error(`${res.status}`);
        
        const json = await res.json();
        
        const users = Array.isArray(json) ? json
            : Array.isArray(json.data) ? json.data
            : [];
        
        setUsers(users);
    } catch (err) {
        console.error("fetchUsers failed:", err);
        setUsers([]);
    } finally {
        setLoading(false);
    }
};

  const handleBan = async (userId: number) => {
    if (!confirm("Bạn có chắc muốn ban user này?")) return;
    await apiFetch(`/users/${userId}`, { method: "DELETE" });
    fetchUsers(); // refresh
  };

  const filtered = users.filter(u =>
    u.UserName.toLowerCase().includes(search.toLowerCase()) ||
    u.Email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg bg-slate-800 border border-blue-500/30 text-white w-64"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div key={user.UserId}
              className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-blue-500/20">
              <div>
                <p className="text-white font-medium">{user.UserName}</p>
                <p className="text-sm text-gray-400">{user.Email} • {user.RoleName}</p>
              </div>
              <div className="flex gap-2">
                {/* → User Detail Page */}
                <button
                  onClick={() => router.push(`/admin-dashboard/users/${user.UserId}`)}
                  className="px-3 py-1 text-sm border border-blue-500/50 text-blue-400 rounded hover:bg-blue-500/10">
                  Edit Role
                </button>
                <button
                  onClick={() => handleBan(user.UserId)}
                  className="px-3 py-1 text-sm border border-red-500/50 text-red-400 rounded hover:bg-red-500/10">
                  Ban
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}