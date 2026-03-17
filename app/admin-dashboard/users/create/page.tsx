'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, UserPlus, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

// Roles available in the system (from enums.ts)
const ROLES = ["ADMIN", "MANAGER", "ARTIST", "CUSTOMER",] as const;
type Role = typeof ROLES[number];

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full system access, manage all users and settings",
  MANAGER: "Manage orders, catalog, assign tasks to artists",
  ARTIST: "Access artist dashboard, work on assigned orders",
  CUSTOMER: "Browse marketplace, place orders, download files",
};

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "border-red-500/50 bg-red-500/10 text-red-400",
  MANAGER: "border-purple-500/50 bg-purple-500/10 text-purple-400",
  ARTIST: "border-cyan-500/50 bg-cyan-500/10 text-cyan-400",
  CUSTOMER: "border-blue-500/50 bg-blue-500/10 text-blue-400",

};

export default function CreateUserPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    UserName: "",
    Email: "",
    PasswordHash: "",
    ConfirmPassword: "",
    Phone: "",
    selectedRole: "CUSTOMER" as Role,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  // Validate form
  const validate = (): string | null => {
    if (!form.UserName.trim()) return "Username is required.";
    if (!form.Email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) return "Invalid email format.";
    if (!form.PasswordHash) return "Password is required.";
    if (form.PasswordHash.length < 6 || form.PasswordHash.length > 12)
      return "Password must be 6–12 characters.";
    if (form.PasswordHash !== form.ConfirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { setMessage({ type: "error", text: err }); return; }

    setLoading(true);
    setMessage(null);

    try {
      // ✅ STEP 1: Register user via POST /api/auth/register
      // BE tạo với role CUSTOMER mặc định
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          UserName: form.UserName,
          Email: form.Email,
          PasswordHash: form.PasswordHash,
          ConfirmPassword: form.ConfirmPassword,
          Phone: form.Phone || null,
          CompanyId: null,
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(registerData.message ?? "Registration failed.");
      }

      const newUserId: number = registerData.user?.userId ?? registerData.userId;
      setCreatedUserId(newUserId);

      // ✅ STEP 2: Nếu role không phải CUSTOMER → cần set role
      // Hiện tại BE chưa có update-role endpoint nên dùng approve cho SELLER
      // Với các role khác → cần BE bổ sung
      if (form.selectedRole !== "CUSTOMER") {
        // ADMIN / MANAGER / ARTIST — cần BE bổ sung endpoint update role
        // Hiện tại: thông báo để admin biết cần update thủ công
        setMessage({
          type: "success",
          text: `✅ User created (ID: #${newUserId}) with CUSTOMER role. ⚠️ Please manually update to ${form.selectedRole} role via Edit User page (requires BE to add role-update endpoint).`,
        });
        return;
      }

      setMessage({
        type: "success",
        text: `User "${form.UserName}" created successfully with role ${form.selectedRole}! (ID: #${newUserId})`,
      });

      // Reset form
      setForm({
        UserName: "",
        Email: "",
        PasswordHash: "",
        ConfirmPassword: "",
        Phone: "",
        selectedRole: "CUSTOMER",
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-gray-400 mb-6 hover:text-white transition text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Account</h1>
          <p className="text-gray-400 text-sm">Add a new user with a specific role</p>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Account Info ── */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">
            Account Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white text-sm">Username *</label>
              <input
                value={form.UserName}
                onChange={(e) => update("UserName", e.target.value)}
                placeholder="john_doe"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white text-sm">Phone</label>
              <input
                value={form.Phone}
                onChange={(e) => update("Phone", e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-white text-sm">Email *</label>
            <input
              type="email"
              value={form.Email}
              onChange={(e) => update("Email", e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white text-sm">Password * <span className="text-slate-500">(6–12 chars)</span></label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.PasswordHash}
                  onChange={(e) => update("PasswordHash", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-white text-sm">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.ConfirmPassword}
                  onChange={(e) => update("ConfirmPassword", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password match indicator */}
              {form.ConfirmPassword && (
                <p className={`text-xs mt-1 ${form.PasswordHash === form.ConfirmPassword ? "text-green-400" : "text-red-400"}`}>
                  {form.PasswordHash === form.ConfirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Role Selection ── */}
        <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-6">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider text-slate-400 mb-4">
            Select Role
          </h2>
          <div className="space-y-2">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => update("selectedRole", role)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-left ${form.selectedRole === role
                    ? ROLE_COLORS[role] + " border-opacity-100"
                    : "border-slate-700 hover:border-slate-500 text-slate-400"
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${form.selectedRole === role ? "bg-current" : "bg-slate-600"
                      }`} />
                    <span className="font-semibold text-sm">{role}</span>
                  </div>
                  <p className="text-xs mt-0.5 ml-4 text-slate-400">{ROLE_DESCRIPTIONS[role]}</p>
                </div>
                {form.selectedRole === role && (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Warning for non-CUSTOMER/SELLER roles */}
          {form.selectedRole !== "CUSTOMER" && form.selectedRole !== "SELLER" && (
            <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-400">
              ⚠️ <strong>{form.selectedRole}</strong> role: User will be created as CUSTOMER first, then you'll need to manually update the role via the Edit User page. This requires a role-update endpoint to be added to the BE.
            </div>
          )}
          {form.selectedRole === "SELLER" && (
            <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-xs text-green-400">
              ✅ SELLER: Will be set automatically via <code>/api/users/:id/approve</code>
            </div>
          )}
          {form.selectedRole === "CUSTOMER" && (
            <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-blue-400">
              ✅ CUSTOMER: Default role, set automatically on register.
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}>
            {message.type === "success"
              ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 text-sm border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700/50 transition"
          >
            Cancel
          </button>

          {/* Go to created user if success */}
          {createdUserId && message?.type === "success" && (
            <button
              onClick={() => router.push(`/admin-dashboard/users/${createdUserId}`)}
              className="flex-1 py-3 text-sm border border-cyan-500/50 text-cyan-400 rounded-xl hover:bg-cyan-500/10 transition"
            >
              Edit Created User →
            </button>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? "Creating..." : `Create ${form.selectedRole} Account`}
          </button>
        </div>
      </div>
    </div>
  );
}