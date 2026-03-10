'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const ROLES = [
  { id: 1, name: "ADMIN" },
  { id: 2, name: "MANAGER" },
  { id: 3, name: "ARTIST" },
  { id: 4, name: "CUSTOMER" },
];

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch(`/users/${id}`)
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setSelectedRole(data.RoleId);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ roleId: selectedRole }),
      });
      setMessage("✅ Role updated successfully!");
    } catch {
      setMessage("❌ Failed to update role.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="max-w-lg">
      <button onClick={() => router.back()} className="text-gray-400 mb-4 hover:text-white">
        ← Back
      </button>
      <h1 className="text-2xl font-bold text-white mb-6">User Detail</h1>

      <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-gray-400 text-sm">Username</p>
          <p className="text-white font-medium">{user.UserName}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Email</p>
          <p className="text-white">{user.Email}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-2">Role</p>
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-slate-900 border border-blue-500/30 text-white"
          >
            {ROLES.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>

        {message && <p className="text-sm">{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}