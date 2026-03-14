'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  Loader2, Save, ArrowLeft, AlertCircle, CheckCircle2,
  Building2, ChevronDown, Search, X, UserCheck, Trash2,
  RefreshCw
} from "lucide-react";

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
    ACTIVE:    "bg-green-500/20 text-green-300 border-green-500/30",
    INACTIVE:  "bg-slate-500/20 text-slate-400 border-slate-500/30",
    SUSPENDED: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#0e1525] border border-blue-500/20 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-white font-semibold text-sm">Assign Company</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company name or email..."
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-blue-500/20 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-72 divide-y divide-white/5">
          {/* Remove company option */}
          {currentCompanyId && (
            <button
              onClick={() => onSelect(null)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-500/10 transition text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-red-400 text-sm font-medium">Remove from company</p>
                <p className="text-slate-500 text-xs">Set CompanyId to null</p>
              </div>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">
              No companies found
            </div>
          ) : (
            filtered.map((company) => {
              const isActive = company.CompanyId === currentCompanyId;
              const statusCls = STATUS_COLOR[company.Status ?? ""] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";
              return (
                <button
                  key={company.CompanyId}
                  onClick={() => onSelect(company)}
                  className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-500/10 transition text-left ${isActive ? "bg-blue-500/10" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                    isActive ? "bg-cyan-500 text-white" : "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                  }`}>
                    {isActive ? <CheckCircle2 className="w-4 h-4" /> : company.CompanyName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">{company.CompanyName}</p>
                      {company.Status && (
                        <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${statusCls}`}>
                          {company.Status}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs truncate">
                      {company.CompanyType ?? "—"}{company.Email ? ` · ${company.Email}` : ""}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/8 text-center">
          <p className="text-slate-600 text-xs">{companies.length} companies total</p>
        </div>
      </div>
    </div>
  );
}

// ===================== Main Page =====================
export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser]         = useState<UserProfile | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [assigningSaving, setAssigningSaving] = useState(false);
  const [message, setMessage]   = useState<MessageState>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Pending company assignment (before save)
  const [pendingCompany, setPendingCompany] = useState<{
    companyId: number | null;
    companyName: string | null;
    changed: boolean;
  }>({ companyId: null, companyName: null, changed: false });

  const [form, setForm] = useState({ UserName: "", Email: "", Phone: "" });

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
          Email:    form.Email    || undefined,
          Phone:    form.Phone    || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.message ?? "Update failed." });
        return;
      }
      const updated: UserProfile = data.data ?? data;
      setUser(updated);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ===================== Assign company =====================
  const handleCompanySelect = (company: Company | null) => {
    setPendingCompany({
      companyId:   company?.CompanyId ?? null,
      companyName: company?.CompanyName ?? null,
      changed: (company?.CompanyId ?? null) !== user?.CompanyId,
    });
    setShowCompanyModal(false);
  };

  // Save company assignment: PUT /api/users/:id  { CompanyId }
  // Note: BE userController.update nhận CompanyId nếu có
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
        companyId:   updated.CompanyId,
        companyName: updated.CompanyName,
        changed: false,
      });
      setMessage({ type: "success", text: pendingCompany.companyId
        ? `User assigned to "${pendingCompany.companyName}" successfully!`
        : "Company removed from user successfully!"
      });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Network error." });
    } finally {
      setAssigningSaving(false);
    }
  };

  // ===================== Approve as SELLER =====================
  const handleApproveBusiness = async () => {
    if (!confirm("Approve this user as SELLER?")) return;
    setSaving(true);
    clearMessage();
    try {
      const res = await apiFetch(`/users/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUser(data.data ?? data);
      setMessage({ type: "success", text: "Account approved as SELLER!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message ?? "Approve failed." });
    } finally {
      setSaving(false);
    }
  };

  // ===================== Render helpers =====================
  const ROLE_COLOR: Record<string, string> = {
    ADMIN:    "bg-red-500/20 text-red-300 border border-red-500/30",
    MANAGER:  "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    ARTIST:   "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    CUSTOMER: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    SELLER:   "bg-green-500/20 text-green-300 border border-green-500/30",
  };

  const currentCompany = companies.find(c => c.CompanyId === pendingCompany.companyId);

  // ===================== Loading / Error states =====================
  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 py-12">
      <Loader2 className="w-5 h-5 animate-spin" /> Loading user...
    </div>
  );

  if (!user) return (
    <div className="flex items-center gap-2 text-red-400 py-8">
      <AlertCircle className="w-5 h-5" /> User not found.
    </div>
  );

  return (
    <>
      <div className="max-w-2xl">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-400 mb-6 hover:text-white transition text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Edit User</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLOR[user.RoleName] ?? "bg-slate-600 text-slate-300"}`}>
            {user.RoleName}
          </span>
        </div>

        {/* Global message */}
        {message && (
          <div className={`flex items-start gap-2.5 text-sm rounded-xl px-4 py-3 mb-5 border ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border-green-500/25"
              : "bg-red-500/10 text-red-400 border-red-500/25"
          }`}>
            {message.type === "success"
              ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
            <span>{message.text}</span>
            <button onClick={clearMessage} className="ml-auto opacity-60 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="space-y-5">

          {/* ===== READ-ONLY INFO ===== */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Account Info</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">User ID</p>
                <p className="text-white font-mono">#{user.UserId}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Role</p>
                <p className="text-white">{user.RoleName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Member since</p>
                <p className="text-white">{new Date(user.CreatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* ===== ASSIGN COMPANY (primary feature) ===== */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white font-semibold text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Company Assignment
                </p>
                <p className="text-slate-500 text-xs mt-0.5">Link this user to a company</p>
              </div>
              {pendingCompany.changed && (
                <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5">
                  Unsaved changes
                </span>
              )}
            </div>

            {/* Current / pending assignment */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 flex items-center gap-3 bg-slate-900/60 border border-blue-500/20 rounded-xl px-4 py-3 min-h-[56px]">
                {pendingCompany.companyId ? (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold text-sm">
                      {(pendingCompany.companyName ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">{pendingCompany.companyName}</p>
                      <p className="text-slate-500 text-xs">
                        ID #{pendingCompany.companyId}
                        {currentCompany?.CompanyType ? ` · ${currentCompany.CompanyType}` : ""}
                        {currentCompany?.Status ? ` · ${currentCompany.Status}` : ""}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">No company assigned</span>
                  </div>
                )}
              </div>

              {/* Change button */}
              <button
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 border border-blue-500/40 text-cyan-400 hover:bg-blue-500/10 rounded-xl text-xs font-medium transition flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Change
              </button>
            </div>

            {/* Before / after diff when changed */}
            {pendingCompany.changed && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-4 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2">
                <span className="text-slate-500 line-through">{user.CompanyName ?? "None"}</span>
                <span className="text-slate-500">→</span>
                <span className="text-yellow-300 font-medium">{pendingCompany.companyName ?? "None (remove)"}</span>
              </div>
            )}

            {/* Save company button */}
            <button
              onClick={handleSaveCompany}
              disabled={!pendingCompany.changed || assigningSaving}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
                pendingCompany.changed
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/15"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              }`}
            >
              {assigningSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Building2 className="w-4 h-4" /> Save Company Assignment</>
              )}
            </button>
          </div>

          {/* ===== PROFILE FIELDS ===== */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <p className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              Profile Details
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-slate-300 text-xs mb-1.5 block">Username</label>
                <input
                  value={form.UserName}
                  onChange={(e) => setForm(p => ({ ...p, UserName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-blue-500/25 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="text-slate-300 text-xs mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.Email}
                  onChange={(e) => setForm(p => ({ ...p, Email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-blue-500/25 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-slate-300 text-xs mb-1.5 block">Phone</label>
                <input
                  value={form.Phone}
                  onChange={(e) => setForm(p => ({ ...p, Phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-blue-500/25 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                  placeholder="+84 xxx xxx xxx"
                />
              </div>
            </div>

            <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-lg px-3 py-2 text-xs text-yellow-500 mt-4">
              Role cannot be changed via this form. Use "Approve as SELLER" to promote user.
            </div>

            <div className="flex gap-3 mt-4">
              {user.RoleName !== "SELLER" && user.RoleName !== "ADMIN" && (
                <button
                  onClick={handleApproveBusiness}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm border border-cyan-500/40 text-cyan-400 rounded-xl hover:bg-cyan-500/10 disabled:opacity-50 transition"
                >
                  Approve as SELLER
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2 font-medium"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Profile"}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Company selector modal */}
      {showCompanyModal && (
        <CompanySelectorModal
          companies={companies}
          currentCompanyId={pendingCompany.companyId}
          onSelect={handleCompanySelect}
          onClose={() => setShowCompanyModal(false)}
        />
      )}
    </>
  );
}