'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Loader2, Save, ArrowLeft, AlertCircle, CheckCircle2,
  Building2, ChevronDown, Search, X, UserCheck, Trash2,
  RefreshCw, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Roles available in the system
const ROLES = ["ADMIN", "MANAGER", "ARTIST", "CUSTOMER"];

// ===================== Types =====================
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

interface Company {
  CompanyId: number;
  CompanyName: string;
  CompanyType: string | null;
  Status: string | null;
  Email: string | null;
}

type MessageState = { type: "success" | "error"; text: string } | null;

// ===================== Company Selector Modal =====================
function CompanySelectorModal({
  companies,
  currentCompanyId,
  onSelect,
  onClose,
}: {
  companies: Company[];
  currentCompanyId: number | null;
  onSelect: (company: Company | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = companies.filter((c) =>
    c.CompanyName.toLowerCase().includes(search.toLowerCase()) ||
    (c.Email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_COLOR: Record<string, string> = {
    ACTIVE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    INACTIVE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    SUSPENDED: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1324] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-bold text-sm tracking-wide">Assign Company</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company name or email..."
              className="w-full pl-9 pr-4 py-2 bg-[#080d1a] border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-72 divide-y divide-white/[0.04]">
          {/* Remove company option */}
          {currentCompanyId && (
            <button
              onClick={() => onSelect(null)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-rose-500/5 transition-all text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <p className="text-rose-400 text-sm font-semibold">Remove from company</p>
                <p className="text-slate-500 text-xs mt-0.5">Unlink company assignment</p>
              </div>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-xs font-semibold">
              No companies found matching query
            </div>
          ) : (
            filtered.map((company) => {
              const isActive = company.CompanyId === currentCompanyId;
              const statusCls = STATUS_COLOR[company.Status ?? ""] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
              return (
                <button
                  key={company.CompanyId}
                  onClick={() => onSelect(company)}
                  className={`w-full flex items-center gap-3.5 px-5 py-3 hover:bg-[#080d1a] transition-all text-left cursor-pointer ${isActive ? "bg-indigo-500/5 border-l-2 border-indigo-500" : ""}`}
                >
                  <div className={`w-8.5 h-8.5 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${isActive ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/[0.02] border border-white/[0.06] text-slate-400"
                    }`}>
                    {isActive ? <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400" /> : company.CompanyName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold truncate">{company.CompanyName}</p>
                      {company.Status && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${statusCls}`}>
                          {company.Status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 truncate">
                      {company.CompanyType ?? "—"}{company.Email ? ` · ${company.Email}` : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/[0.06] text-center">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider">{companies.length} Registered Companies</p>
        </div>
      </motion.div>
    </div>
  );
}

// ===================== Main Page =====================
export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigningSaving, setAssigningSaving] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Pending company assignment (before save)
  const [pendingCompany, setPendingCompany] = useState<{
    companyId: number | null;
    companyName: string | null;
    changed: boolean;
  }>({ companyId: null, companyName: null, changed: false });

  const [form, setForm] = useState({ UserName: "", Email: "", Phone: "" });
  const [selectedRole, setSelectedRole] = useState("CUSTOMER");

  // ===================== Load user + companies =====================
  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiFetch(`/users/${id}`).then(r => r.json()),
      apiFetch("/companies").then(r => r.json()),
    ])
      .then(([userData, companiesData]) => {
        const u: UserProfile = userData.data ?? userData;
        setUser(u);
        setForm({ UserName: u.UserName ?? "", Email: u.Email ?? "", Phone: u.Phone ?? "" });
        setSelectedRole(u.RoleName);
        setPendingCompany({ companyId: u.CompanyId, companyName: u.CompanyName, changed: false });
        setCompanies(companiesData.data ?? companiesData ?? []);
      })
      .catch(() => setMessage({ type: "error", text: "Cannot load user data." }))
      .finally(() => setLoading(false));
  }, [id]);

  const clearMessage = () => setMessage(null);

  // ===================== Save profile (UserName, Email, Phone) =====================
  const handleSaveProfile = async () => {
    if (!form.Email.trim() && !form.UserName.trim() && !form.Phone.trim()) {
      setMessage({ type: "error", text: "At least one field must be filled." });
      return;
    }
    if (form.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) {
      setMessage({ type: "error", text: "Invalid email format." });
      return;
    }
    setSaving(true);
    clearMessage();
    try {
      const res = await apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          UserName: form.UserName || undefined,
          Email: form.Email || undefined,
          Phone: form.Phone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message ?? "Update failed." });
        return;
      }
      const updated: UserProfile = data.data ?? data;
      setUser(updated);
      setMessage({ type: "success", text: "Profile details updated successfully!" });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ===================== Assign company =====================
  const handleCompanySelect = (company: Company | null) => {
    setPendingCompany({
      companyId: company?.CompanyId ?? null,
      companyName: company?.CompanyName ?? null,
      changed: (company?.CompanyId ?? null) !== user?.CompanyId,
    });
    setShowCompanyModal(false);
  };

  const handleSaveCompany = async () => {
    if (!pendingCompany.changed) return;
    setAssigningSaving(true);
    clearMessage();
    try {
      const res = await apiFetch(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify({ CompanyId: pendingCompany.companyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Assign failed.");
      const updated: UserProfile = data.data ?? data;
      setUser(updated);
      setPendingCompany({
        companyId: updated.CompanyId,
        companyName: updated.CompanyName,
        changed: false,
      });
      setMessage({
        type: "success", text: pendingCompany.companyId
          ? `User assigned to "${pendingCompany.companyName}" successfully!`
          : "Company removed from user successfully!"
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Network error." });
    } finally {
      setAssigningSaving(false);
    }
  };

  // ===================== Assign Role =====================
  const handleSaveRole = async () => {
    if (selectedRole === user?.RoleName) return;
    setRoleSaving(true);
    clearMessage();
    try {
      const res = await apiFetch(`/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ roleName: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Role update failed.");
      const updated: UserProfile = data.data ?? data;
      setUser(updated);
      setSelectedRole(updated.RoleName);
      setMessage({ type: "success", text: "User role updated successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Network error." });
      setSelectedRole(user?.RoleName ?? "CUSTOMER"); // Revert on failure
    } finally {
      setRoleSaving(false);
    }
  };

  // ===================== Render helpers =====================
  const ROLE_COLOR: Record<string, string> = {
    ADMIN: "bg-rose-500/10 text-rose-300 border border-rose-500/20",
    MANAGER: "bg-purple-500/10 text-purple-300 border border-purple-500/20",
    ARTIST: "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20",
    CUSTOMER: "bg-sky-500/10 text-sky-300 border border-sky-500/20",
    SELLER: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20",
  };

  const currentCompany = companies.find(c => c.CompanyId === pendingCompany.companyId);

  // ===================== Loading / Error states =====================
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      <span className="text-slate-400 text-sm font-medium animate-pulse">Loading directory profile...</span>
    </div>
  );

  if (!user) return (
    <div className="flex items-center gap-2 text-rose-400 py-8 font-semibold text-sm">
      <AlertCircle className="w-5 h-5" /> Account information could not be retrieved.
    </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </button>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Modify Profile Details</h1>
            <p className="text-slate-400 text-xs mt-0.5">Customize account settings and authority levels</p>
          </div>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${ROLE_COLOR[user.RoleName] ?? "bg-slate-600 text-slate-300"}`}>
            {user.RoleName}
          </span>
        </div>

        {/* Global message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 border font-semibold relative ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {message.type === "success"
              ? <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />}
            <span className="pr-6">{message.text}</span>
            <button onClick={clearMessage} className="absolute right-3 top-3.5 opacity-60 hover:opacity-100 cursor-pointer transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Metadata & Access Control */}
          <div className="lg:col-span-5 space-y-5">
          {/* ===== READ-ONLY INFO ===== */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm shadow-md"
          >
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Metadata Overview</p>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-bold mb-1 uppercase tracking-wider">Account ID</p>
                <p className="text-white font-mono font-semibold">#{user.UserId}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold mb-1 uppercase tracking-wider">Current Role</p>
                <p className="text-white font-semibold">{user.RoleName}</p>
              </div>
              <div>
                <p className="text-slate-500 font-bold mb-1 uppercase tracking-wider">Creation Date</p>
                <p className="text-white font-semibold">{new Date(user.CreatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </motion.div>

          {/* ===== ASSIGN COMPANY ===== */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm shadow-md space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Company Association
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Link user to a verified business</p>
              </div>
              {pendingCompany.changed && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                  Unsaved Draft
                </span>
              )}
            </div>

            {/* Current / pending assignment */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3.5 bg-[#080d1a] border border-white/[0.06] rounded-xl px-4 py-3 min-h-[64px]">
                {pendingCompany.companyId ? (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-300 font-extrabold text-sm">
                      {(pendingCompany.companyName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{pendingCompany.companyName}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        ID #{pendingCompany.companyId}
                        {currentCompany?.CompanyType ? ` · ${currentCompany.CompanyType}` : ""}
                        {currentCompany?.Status ? ` · ${currentCompany.Status}` : ""}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <Building2 className="w-4.5 h-4.5" />
                    <span className="text-xs font-semibold">No assigned company</span>
                  </div>
                )}
              </div>

              {/* Change button */}
              <button
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 border border-white/[0.08] hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 rounded-xl text-xs font-bold transition-all flex-shrink-0 cursor-pointer bg-[#0d1324]/50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change
              </button>
            </div>

            {/* Diff indicators */}
            {pendingCompany.changed && (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-amber-500/5 border border-amber-500/10 rounded-xl px-3.5 py-2 font-medium">
                <span className="text-slate-500 line-through">{user.CompanyName ?? "None"}</span>
                <span className="text-slate-500">→</span>
                <span className="text-amber-300 font-bold">{pendingCompany.companyName ?? "None (remove)"}</span>
              </div>
            )}

            {/* Save company button */}
            <motion.button
              whileHover={pendingCompany.changed ? { scale: 1.01 } : {}}
              whileTap={pendingCompany.changed ? { scale: 0.99 } : {}}
              onClick={handleSaveCompany}
              disabled={!pendingCompany.changed || assigningSaving}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${pendingCompany.changed
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white shadow-md shadow-indigo-500/15"
                : "bg-white/[0.02] border border-white/[0.04] text-slate-500 cursor-not-allowed"
                }`}
            >
              {assigningSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving Assignment…</>
              ) : (
                <><Building2 className="w-4 h-4" /> Save Company Assignment</>
              )}
            </motion.button>
          </motion.div>

          {/* ===== ROLE MANAGEMENT ===== */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm shadow-md space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
              <div>
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Role Assignment
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Control user access privileges</p>
              </div>
              {selectedRole !== user?.RoleName && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                  Unsaved Draft
                </span>
              )}
            </div>

            {user.RoleName === "ADMIN" ? (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3 text-xs text-rose-300 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Administrative authority cannot be changed.
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {ROLES.filter(r => r !== "ADMIN").map(role => (
                    <option key={role} value={role} className="bg-slate-900 text-white">{role}</option>
                  ))}
                </select>

                <motion.button
                  whileHover={selectedRole !== user.RoleName ? { scale: 1.01 } : {}}
                  whileTap={selectedRole !== user.RoleName ? { scale: 0.99 } : {}}
                  onClick={handleSaveRole}
                  disabled={selectedRole === user.RoleName || roleSaving}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedRole !== user.RoleName
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white shadow-md shadow-purple-500/15"
                    : "bg-white/[0.02] border border-white/[0.04] text-slate-500 cursor-not-allowed"
                    }`}
                >
                  {roleSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving Role…</>
                  ) : (
                    <><Shield className="w-4 h-4" /> Save Active Role</>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>
          </div>

          {/* Right Column: Customization Fields */}
          <div className="lg:col-span-7 space-y-5">
            {/* ===== PROFILE FIELDS ===== */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#0d1324]/50 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm shadow-md space-y-4"
            >
            <p className="text-white font-bold text-sm mb-4 flex items-center gap-2 pb-3 border-b border-white/[0.04]">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Profile Customization
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Username</label>
                <input
                  value={form.UserName}
                  onChange={(e) => setForm(p => ({ ...p, UserName: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={form.Email}
                  onChange={(e) => setForm(p => ({ ...p, Email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-semibold mb-1.5 block">Phone Number</label>
                <input
                  value={form.Phone}
                  onChange={(e) => setForm(p => ({ ...p, Phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080d1a] border border-white/[0.06] text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
                  placeholder="+84 xxx xxx xxx"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-2.5 text-xs bg-[#0d1324]/80 hover:bg-[#0d1324] border border-white/[0.08] hover:border-indigo-500/30 text-white rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-indigo-400" />}
                {saving ? "Saving Changes…" : "Save Profile Details"}
              </motion.button>
            </div>
          </motion.div>
          </div>
        </div>
      </div>

      {/* Company selector modal */}
      <AnimatePresence>
        {showCompanyModal && (
          <CompanySelectorModal
            companies={companies}
            currentCompanyId={pendingCompany.companyId}
            onSelect={handleCompanySelect}
            onClose={() => setShowCompanyModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}