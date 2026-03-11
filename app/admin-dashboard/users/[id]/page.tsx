'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, Save, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

interface UserProfile {
  UserId: number;
  UserName: string;
  Email: string;
  Phone: string | null;
  RoleId: number;
  RoleName: string;
  CompanyId: number | null;
  CompanyName: string | null;
  CreatedAt: string;
}

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form chỉ chứa fields mà BE hỗ trợ: UserName, Email, Phone
  const [form, setForm] = useState({
    UserName: "",
    Email: "",
    Phone: "",
  });

  // Fetch user: GET /api/users/:id (ADMIN/MANAGER only)
  useEffect(() => {
    if (!id) return;
    apiFetch(`/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        // BE trả về { message: "...", data: {...} }
        const u: UserProfile = data.data ?? data;
        setUser(u);
        setForm({
          UserName: u.UserName ?? "",
          Email: u.Email ?? "",
          Phone: u.Phone ?? "",
        });
      })
      .catch(() => setMessage({ type: "error", text: "Cannot load user." }))
      .finally(() => setLoading(false));
  }, [id]);

  // Save: PUT /api/users/:id — body: { UserName, Email, Phone }
  // Route: router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), userController.update)
  const handleSave = async () => {
    if (!form.UserName.trim() && !form.Email.trim() && !form.Phone.trim()) {
      setMessage({ type: "error", text: "At least one field must be filled." });
      return;
    }

    // Email validation
    if (form.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) {
      setMessage({ type: "error", text: "Invalid email format." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      // ĐÚNG endpoint: PUT /api/users/:id
      const res = await apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          // ĐÚNG body: chỉ UserName, Email, Phone — khớp với userController.update
          UserName: form.UserName || undefined,
          Email: form.Email || undefined,
          Phone: form.Phone || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle specific BE errors
        if (res.status === 409) {
          setMessage({ type: "error", text: data.message }); // "Email đã được sử dụng bởi user khác"
        } else if (res.status === 403) {
          setMessage({ type: "error", text: "You don't have permission to update this user." });
        } else {
          setMessage({ type: "error", text: data.message ?? "Update failed." });
        }
        return;
      }

      // Update local state với data mới từ BE
      setUser(data.data ?? data);
      setMessage({ type: "success", text: "User updated successfully!" });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // Approve Business Account: POST /api/users/:id/approve → đổi role sang SELLER
  // Route: router.post('/:id/approve', ...) — nếu BE có
  // Hiện tại BE có: approveBusinessAccount trong userController
  const handleApproveBusiness = async () => {
    if (!confirm("Approve this user as SELLER?")) return;
    setSaving(true);
    try {
      // Endpoint này cần được thêm vào router BE: router.post('/:id/approve', ...)
      const res = await apiFetch(`/users/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUser(data.data);
      setMessage({ type: "success", text: "Account approved as SELLER!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Approve failed." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-8">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading user...
      </div>
    );
  }

  if (!user) {
    return <p className="text-red-400 py-8">User not found.</p>;
  }

  return (
    <div className="max-w-lg">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 mb-6 hover:text-white transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">Edit User</h1>

      <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 space-y-5">

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-700">
          <div>
            <p className="text-gray-400 text-xs mb-1">User ID</p>
            <p className="text-white text-sm font-mono">#{user.UserId}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs mb-1">Current Role</p>
            <span className="inline-block text-xs px-2 py-1 rounded bg-blue-600/80 text-white">
              {user.RoleName}
            </span>
          </div>
          {user.CompanyName && (
            <div className="col-span-2">
              <p className="text-gray-400 text-xs mb-1">Company</p>
              <p className="text-white text-sm">{user.CompanyName}</p>
            </div>
          )}
        </div>

        {/* Editable fields — khớp với BE: UserName, Email, Phone */}
        <div className="space-y-4">
          <div>
            <label className="text-white text-sm mb-1.5 block">Username</label>
            <input
              value={form.UserName}
              onChange={(e) => setForm((p) => ({ ...p, UserName: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="text-white text-sm mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.Email}
              onChange={(e) => setForm((p) => ({ ...p, Email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="text-white text-sm mb-1.5 block">Phone</label>
            <input
              value={form.Phone}
              onChange={(e) => setForm((p) => ({ ...p, Phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/30 text-white text-sm focus:outline-none focus:border-cyan-500"
              placeholder="+84 xxx xxx xxx"
            />
          </div>
        </div>

        {/*  Note về role — BE chưa có endpoint update role */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-400">
           <strong>Note:</strong> Role cannot be changed via this form — BE does not expose a role-update endpoint yet. Use "Approve Business" to promote a user to SELLER.
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}>
            {message.type === "success"
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {/*  Approve as SELLER — gọi approveBusinessAccount trong BE */}
          {user.RoleName !== "SELLER" && user.RoleName !== "ADMIN" && (
            <button
              onClick={handleApproveBusiness}
              disabled={saving}
              className="flex-1 py-2 text-sm border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/10 disabled:opacity-50 transition"
            >
              Approve as SELLER
            </button>
          )}

          {/*  Save: PUT /api/users/:id */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}