'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { buildApiUrl } from "@/lib/apiBase";
import { ArrowLeft, UserPlus, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

// Roles available in the system (from enums.ts)
const ROLES = ["ADMIN", "MANAGER", "ARTIST", "CUSTOMER", "SELLER"] as const;
type Role = typeof ROLES[number];

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: "Full system access, manage all users and settings",
  MANAGER: "Manage orders, catalog, assign tasks to artists",
  ARTIST: "Access artist dashboard, work on assigned orders",
  CUSTOMER: "Browse marketplace, place orders, download files",
  SELLER: "Approved business account, sell on marketplace",
};

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "border-rose-500/30 text-rose-400 bg-rose-500/5 hover:border-rose-500/50",
  MANAGER: "border-purple-500/30 text-purple-400 bg-purple-500/5 hover:border-purple-500/50",
  ARTIST: "border-cyan-500/30 text-cyan-400 bg-cyan-500/5 hover:border-cyan-500/50",
  CUSTOMER: "border-sky-500/30 text-sky-400 bg-sky-500/5 hover:border-sky-500/50",
  SELLER: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:border-emerald-500/50",
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
      const registerRes = await fetch(buildApiUrl("/auth/register"), {
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

      if (form.selectedRole === "SELLER") {
        const approveRes = await apiFetch(`/users/${newUserId}/approve`, {
          method: "POST",
        });
        if (!approveRes.ok) {
          const approveData = await approveRes.json();
          setMessage({
            type: "error",
            text: `User created (ID: #${newUserId}) but role set failed: ${approveData.message}. Please edit manually.`,
          });
          return;
        }
      } else if (form.selectedRole !== "CUSTOMER") {
        setMessage({
          type: "success",
          text: `✅ User created (ID: #${newUserId}) with CUSTOMER role. ⚠️ Please manually update to ${form.selectedRole} role via Edit User page.`,
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
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/[0.06] pb-6">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.25)]">
          <UserPlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create User Account</h1>
          <p className="text-slate-400 text-sm mt-0.5">Provision a new platform profile and configure initial settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-6 space-y-5 backdrop-blur-sm shadow-lg"
        >
          <h2 className="text-white font-bold text-xs uppercase tracking-wider text-indigo-400 border-b border-white/[0.04] pb-3">
            Account Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">Username *</label>
              <input
                value={form.UserName}
                onChange={(e) => update("UserName", e.target.value)}
                placeholder="john_doe"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">Phone</label>
              <input
                value={form.Phone}
                onChange={(e) => update("Phone", e.target.value)}
                placeholder="+84 xxx xxx xxx"
                className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold">Email Address *</label>
            <input
              type="email"
              value={form.Email}
              onChange={(e) => update("Email", e.target.value)}
              placeholder="user@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">Password * <span className="text-slate-500 font-normal">(6–12 chars)</span></label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.PasswordHash}
                  onChange={(e) => update("PasswordHash", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.ConfirmPassword}
                  onChange={(e) => update("ConfirmPassword", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {form.ConfirmPassword && (
                <p className={`text-[10px] font-bold mt-1.5 ${form.PasswordHash === form.ConfirmPassword ? "text-emerald-400" : "text-rose-400"}`}>
                  {form.PasswordHash === form.ConfirmPassword ? "✓ Credentials match" : "✗ Credentials mismatch"}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Role Selection */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-6 space-y-4 backdrop-blur-sm shadow-lg"
        >
          <h2 className="text-white font-bold text-xs uppercase tracking-wider text-purple-400 border-b border-white/[0.04] pb-3">
            Privilege Allocation
          </h2>
          <div className="space-y-2">
            {ROLES.map((role) => {
              const isSelected = form.selectedRole === role;
              return (
                <button
                  key={role}
                  onClick={() => update("selectedRole", role)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? `${ROLE_COLORS[role]} border-current shadow-[0_0_15px_rgba(255,255,255,0.02)]`
                      : "border-white/[0.06] hover:border-white/[0.12] text-slate-400 bg-white/[0.01] hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-current" : "bg-slate-600"
                      }`} />
                      <span className="font-bold text-xs tracking-wider uppercase">{role}</span>
                    </div>
                    <p className="text-slate-500 text-xs ml-4 font-medium">{ROLE_DESCRIPTIONS[role]}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-current" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Inline Notices */}
          {form.selectedRole !== "CUSTOMER" && form.selectedRole !== "SELLER" && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4.5 py-3 text-xs text-amber-300 leading-relaxed font-medium">
              ⚠️ User gets set to <strong>CUSTOMER</strong> first. Elevating to <strong>{form.selectedRole}</strong> requires a separate manual database modification.
            </div>
          )}
          {form.selectedRole === "SELLER" && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4.5 py-3 text-xs text-emerald-300 leading-relaxed font-medium">
              ✓ Seller accounts automatically request authorization and transition immediately.
            </div>
          )}
          {form.selectedRole === "CUSTOMER" && (
            <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl px-4.5 py-3 text-xs text-sky-300 leading-relaxed font-medium">
              ✓ Standard customer accounts are active and functional upon generation.
            </div>
          )}
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 border font-semibold ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {message.type === "success"
              ? <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 text-xs border border-white/[0.08] text-slate-300 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer font-bold"
          >
            Cancel and Discard
          </button>

          {createdUserId && message?.type === "success" && (
            <button
              onClick={() => router.push(`/admin-dashboard/users/${createdUserId}`)}
              className="flex-1 py-3 text-xs border border-indigo-500/30 text-indigo-400 rounded-xl hover:bg-indigo-500/5 transition-colors cursor-pointer font-bold"
            >
              Modify Created Profile →
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-3 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-95 text-white rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4.5 h-4.5" />
            )}
            {loading ? "Provisioning Profile..." : `Provision ${form.selectedRole} Account`}
          </motion.button>
        </div>
      </div>
    </div>
  );
}