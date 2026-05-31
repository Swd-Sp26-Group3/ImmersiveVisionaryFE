"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  TrendingUp, Users, Package, DollarSign, BarChart3,
  Download, Loader2, AlertCircle, Building2, RefreshCw,
  ShoppingBag, Box, Tag, Edit, Plus, Upload, Link2, Calendar
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import { Artist, Company, CreativeOrder } from "./components/type";
import { CompanyModal } from "./components/CompanyModal";
import { OrdersTab } from "./components/OrdersTab";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";

// ===================== Types & Constants =====================
const COMPANY_STATUS_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  ACTIVE: { label: "Active", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", border: "border-emerald-500/20" },
  INACTIVE: { label: "Inactive", color: "bg-slate-500/10 text-slate-400 border-slate-500/20", border: "border-slate-500/20" },
  SUSPENDED: { label: "Suspended", color: "bg-rose-500/10 text-rose-400 border-rose-500/20", border: "border-rose-500/20" },
};
const getCompanyStatusCfg = (s: string | null | undefined) =>
  s ? (COMPANY_STATUS_CONFIG[s] ?? null) : null;

interface Payment {
  PaymentId: number; OrderId: number | null; AssetId: number | null;
  MpOrderId: number | null;
  CompanyId: number; Amount: number; PaymentType: string | null;
  PaymentStatus: "PENDING" | "PAID" | "FAILED"; PaymentDate: string | null;
  CompanyName?: string | null; ProjectName?: string | null; AssetName?: string | null;
  CompanyEmail?: string | null; CompanyPhone?: string | null;
  OrderStatus?: string | null; MpOrderStatus?: string | null;
  BuyerName?: string | null;
  BuyerPhone?: string | null;
}

interface Asset {
  AssetId: number; AssetName: string; Description: string | null;
  Category: string | null; Industry: string | null;
  Price: number | null; PreviewImage: string | null;
  PublishStatus: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  IsMarketplace: boolean | number; AssetType: string | null;
  CreatedAt: string;
}

const ASSET_PUBLISH_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
  PENDING: { label: "Pending Review", color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  PUBLISHED: { label: "Published", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "orders", label: "Orders Stream", icon: Package },
  { id: "catalog", label: "Catalog Mgmt", icon: Box },
  { id: "companies", label: "Companies", icon: Building2 },
  { id: "team", label: "Team Directory", icon: Users },
] as const;
type TabId = typeof TABS[number]["id"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
};

// Helper to compress file using gzip and encode to base64
const compressFileToGzipBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(bytes as any);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const compressedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressedBytes.set(chunk, offset);
    offset += chunk.length;
  }
  let binary = "";
  const len = compressedBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressedBytes[i]);
  }
  return "gzip:" + btoa(binary);
};

const process3DModelFiles = async (files: File[]): Promise<string> => {
  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
    const arrayBuf = await files[0].arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return "zip:" + btoa(binary);
  }

  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".obj")) {
    return compressFileToGzipBase64(files[0]);
  }

  const hasObj = files.some(f => f.name.toLowerCase().endsWith(".obj"));
  if (!hasObj) {
    throw new Error("No .obj file found in the selected files.");
  }

  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const arrayBuf = await zipBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "zip:" + btoa(binary);
};

// ===================== Asset Edit Modal =====================
function AssetEditModal({
  asset, onClose, onSave,
}: {
  asset: Asset;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    AssetName: asset.AssetName,
    Description: asset.Description ?? "",
    Category: asset.Category ?? "",
    Industry: asset.Industry ?? "",
    Price: asset.Price?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploading(true); setError("");
    try {
      const base64Data = await process3DModelFiles(files);

      // Route through Edge proxy to bypass Vercel's 4.5 MB request payload limit and avoid CORS issues.
      const res = await apiFetch(`/api/proxy/assets/${asset.AssetId}`, {
        method: "PUT",
        body: JSON.stringify({
          Base64Data: base64Data
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Upload failed [${res.status}]: ${text}`);
      }

      alert("3D Model uploaded successfully!");
    } catch (err: any) {
      setError(err.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.AssetName.trim()) { setError("Asset name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await apiFetch(`/assets/${asset.AssetId}`, {
        method: "PUT",
        body: JSON.stringify({
          AssetName: form.AssetName || undefined,
          Description: form.Description || null,
          Category: form.Category || null,
          Industry: form.Industry || null,
          Price: form.Price ? Number(form.Price) : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Update failed");
      onSave();
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this asset for marketplace?")) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/assets/${asset.AssetId}/approve`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message);
      onSave();
    } catch (e: any) {
      setError(e.message ?? "Approve failed.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1324] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-white/[0.01]">
          <h2 className="text-white font-bold tracking-tight">Edit Asset Specifications</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">✕</button>
        </div>
        
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {[
            { label: "Asset Name *", key: "AssetName", placeholder: "e.g. Luxury Bag 3D" },
            { label: "Category", key: "Category", placeholder: "e.g. Fashion" },
            { label: "Industry", key: "Industry", placeholder: "e.g. Retail" },
            { label: "Price ($)", key: "Price", placeholder: "e.g. 299" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Description</label>
            <textarea
              value={form.Description}
              onChange={e => setForm(p => ({ ...p, Description: e.target.value }))}
              rows={3}
              placeholder="Asset description..."
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-white/[0.06] rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all resize-none"
            />
          </div>

          {/* Upload Section */}
          <div className="space-y-2 pt-4 border-t border-white/[0.06] mt-4">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Update 3D Model Files (.obj, .mtl, textures, or .zip)</label>
            <div className="border-2 border-dashed border-white/[0.06] hover:border-purple-500/40 rounded-xl p-4 text-center transition-colors relative bg-white/[0.01]">
              <input
                type="file"
                accept=".obj,.mtl,.zip,.png,.jpg,.jpeg"
                multiple
                onChange={handleUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <div className="flex flex-col items-center">
                {uploading ? <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" /> : <Upload className="w-6 h-6 text-slate-500 mb-2" />}
                <p className="text-white text-xs font-medium">{uploading ? "Uploading version..." : "Click to upload replacement files"}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">OBJ, MTL, Textures, or ZIP</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 rounded-xl px-3.5 py-2.5 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>
        
        <div className="flex gap-2.5 p-5 border-t border-white/[0.06] bg-white/[0.01]">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/[0.08] hover:bg-white/[0.02] text-slate-300">Cancel</Button>
          {asset.PublishStatus === "PENDING" && (
            <Button onClick={handleApprove} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              ✓ Approve
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save Specifications
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ===================== Main Dashboard =====================
export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Assets (Catalog = platform Asset3D list)
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState("");
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filterPublish, setFilterPublish] = useState("ALL");

  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState("");
  const [companyModal, setCompanyModal] = useState<{ open: boolean; company: Company | null }>({ open: false, company: null });

  // Artists
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistsError, setArtistsError] = useState("");

  // Orders (for stats only)
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Payments (revenue)
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // ===================== Fetch =====================
  const fetchAssets = () => {
    setAssetsLoading(true); setAssetsError("");
    apiFetch("/assets")
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => setAssets(d.data ?? d))
      .catch(e => setAssetsError(`Cannot load assets. (${e.message})`))
      .finally(() => setAssetsLoading(false));
  };

  const fetchCompanies = () => {
    setCompaniesLoading(true); setCompaniesError("");
    apiFetch("/companies")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setCompanies(d.data ?? d))
      .catch(() => setCompaniesError("Cannot load companies."))
      .finally(() => setCompaniesLoading(false));
  };

  const fetchArtists = () => {
    setArtistsLoading(true); setArtistsError("");
    apiFetch("/users")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { const all: Artist[] = d.data ?? d; setArtists(all.filter(u => u.RoleName === "ARTIST")); })
      .catch(() => setArtistsError("Cannot load artists."))
      .finally(() => setArtistsLoading(false));
  };

  const fetchOrders = () => {
    setOrdersLoading(true);
    apiFetch("/orders")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setOrders(d.data ?? d))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  };

  const fetchPayments = () => {
    setPaymentsLoading(true);
    apiFetch("/payments")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setPayments(d.data ?? d))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  };

  useEffect(() => {
    fetchAssets();
    fetchCompanies();
    fetchArtists();
    fetchOrders();
    fetchPayments();
  }, []);

  // ===================== Revenue =====================
  const paidPayments = useMemo(() => {
    return payments.filter((p: Payment) => {
      if (p.PaymentStatus !== "PAID") return false;
      if (p.OrderId) {
        if (!p.OrderStatus) return true;
        return ["PAID", "DELIVERED", "COMPLETED"].includes(p.OrderStatus);
      }
      if (p.MpOrderId) {
        if (!p.MpOrderStatus) return true;
        return ["PAID", "DELIVERED"].includes(p.MpOrderStatus);
      }
      return true;
    });
  }, [payments]);

  const totalRevenue = useMemo(() =>
    paidPayments.reduce((acc: number, p: Payment) => acc + (Number(p.Amount) || 0), 0)
    , [paidPayments]);

  const revenueByMonth = useMemo(() => {
    return paidPayments.reduce((acc: Record<string, number>, p: Payment) => {
      if (!p.PaymentDate) return acc;
      const m = new Date(p.PaymentDate).toLocaleString("en-US", { month: "short" });
      acc[m] = (acc[m] ?? 0) + (Number(p.Amount) || 0);
      return acc;
    }, {} as Record<string, number>);
  }, [paidPayments]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = useMemo(() =>
    MONTHS.map(m => ({ month: m, revenue: revenueByMonth[m] || 0 }))
    , [revenueByMonth]);

  const fmt = (n: any) => {
    const num = Number(n);
    if (isNaN(num)) return "0 ₫";
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const orderStatusData = [
    { name: "New Briefs", value: orders.filter(o => o.Status === "NEW").length, color: "#eab308" },
    { name: "In Progress", value: orders.filter(o => o.Status === "IN_PRODUCTION").length, color: "#3b82f6" },
    { name: "Client Review", value: orders.filter(o => o.Status === "REVIEW").length, color: "#a855f7" },
    { name: "Completed", value: orders.filter(o => o.Status === "COMPLETED").length, color: "#10b981" },
  ].filter(d => d.value > 0);

  const newOrderCount = orders.filter(o => o.Status === "NEW").length;
  const activeOrders = orders.filter(o => !["COMPLETED", "DELIVERED", "CANCELLED"].includes(o.Status)).length;

  const filteredAssets = filterPublish === "ALL" ? assets : assets.filter(a => a.PublishStatus === filterPublish);
  const pendingAssets = assets.filter(a => a.PublishStatus === "PENDING").length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Manager Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">Monitor project performance, update catalog specifications, and coordinate dispatches</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d1324] border border-white/[0.06]">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-xs font-semibold text-slate-300">Live Management Stream</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue", value: paymentsLoading ? null : fmt(totalRevenue), sub: `${paidPayments.length} paid orders`, color: "from-blue-500/5 via-blue-500/10 to-transparent border-blue-500/20", icon: DollarSign, iconColor: "text-blue-400" },
          { label: "Active Orders", value: ordersLoading ? null : activeOrders, sub: `${newOrderCount} unassigned briefs`, color: "from-emerald-500/5 via-emerald-500/10 to-transparent border-emerald-500/20", icon: Package, iconColor: "text-emerald-400" },
          { label: "Client Companies", value: companiesLoading ? null : companies.length, sub: `${companies.filter(c => String(c.Status) === "ACTIVE").length} active brands`, color: "from-purple-500/5 via-purple-500/10 to-transparent border-purple-500/20", icon: Building2, iconColor: "text-purple-400" },
          { label: "3D Artists", value: artistsLoading ? null : artists.length, sub: `${artists.filter(a => a.IsActive).length} currently active`, color: "from-pink-500/5 via-pink-500/10 to-transparent border-pink-500/20", icon: Users, iconColor: "text-pink-400" },
          { label: "Catalog Assets", value: assetsLoading ? null : assets.length, sub: pendingAssets > 0 ? `${pendingAssets} pending review` : "All models approved", color: "from-amber-500/5 via-amber-500/10 to-transparent border-amber-500/20", icon: Box, iconColor: "text-amber-400" },
        ].map(({ label, value, sub, color, icon: Icon, iconColor }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`bg-gradient-to-br ${color} border rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <div>
              {value === null ? (
                <div className="w-5 h-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin my-1" />
              ) : (
                <>
                  <p className="text-xl font-extrabold text-white tracking-tight leading-none truncate">{value}</p>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium">{sub}</p>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-6">
        <div className="flex gap-1.5 p-1 rounded-xl bg-[#0d1324]/50 border border-white/[0.06] w-full sm:w-fit flex-wrap sm:flex-nowrap overflow-x-auto relative">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap cursor-pointer ${
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-lg"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10 shrink-0" />
                <span className="relative z-10">{label}</span>
                {id === "orders" && newOrderCount > 0 && (
                  <span className="relative z-10 ml-1.5 bg-amber-500 text-black text-[10px] rounded-full px-1.5 py-0.5 font-extrabold leading-none">
                    {newOrderCount}
                  </span>
                )}
                {id === "catalog" && pendingAssets > 0 && (
                  <span className="relative z-10 ml-1.5 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-extrabold leading-none">
                    {pendingAssets}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content area with transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="outline-none"
          >
            {/* ===== OVERVIEW ===== */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Revenue Chart */}
                  <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white text-base font-bold">Revenue Distribution</CardTitle>
                          <CardDescription className="text-slate-400 text-xs">Monthly accumulated PAID orders</CardDescription>
                        </div>
                        {paymentsLoading && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={230}>
                        <AreaChart data={chartData.length > 0 ? chartData : [{ month: "—", revenue: 0 }]} margin={{ top: 10, right: 5, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                          <YAxis stroke="#64748b" tickFormatter={(v) => `${(v/1e6).toFixed(0)}M`} fontSize={11} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0d1324", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                            formatter={(v: any) => [`${v?.toLocaleString("vi-VN") ?? 0} ₫`, "Revenue"]}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGlow)" dot={{ fill: "#06b6d4", r: 4 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Order Status Pie Chart */}
                  <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-base font-bold">Order Workload Status</CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Production progress breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                      {ordersLoading ? (
                        <div className="flex items-center justify-center h-[230px]"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
                      ) : orderStatusData.length === 0 ? (
                        <div className="flex items-center justify-center h-[230px] text-slate-500 text-xs font-semibold">No briefs in progress</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={230}>
                          <PieChart>
                            <Pie
                              data={orderStatusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                              outerRadius={75}
                              dataKey="value"
                              fontSize={10.5}
                              stroke="#0d1324"
                              strokeWidth={2}
                            >
                              {orderStatusData.map((e, i) => (
                                <Cell key={i} fill={e.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "#0d1324", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Payments Section */}
                <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                  <CardHeader className="border-b border-white/[0.06] pb-4 bg-white/[0.01]">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-base font-bold">Recent Paid Ledger</CardTitle>
                        <CardDescription className="text-slate-400 text-xs">Verified deposits and catalog conversions</CardDescription>
                      </div>
                      <Button onClick={fetchPayments} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02]" disabled={paymentsLoading}>
                        <RefreshCw className={`w-3.5 h-3.5 ${paymentsLoading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {paymentsLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-purple-400 animate-spin" /></div>
                    ) : paidPayments.length === 0 ? (
                      <p className="text-center text-slate-500 py-12 text-xs font-semibold">No paid transaction records logged</p>
                    ) : (
                      <div className="max-h-[380px] overflow-y-auto pr-1.5 space-y-2 custom-scrollbar">
                        {paidPayments.slice(0, 10).map((p: Payment) => (
                          <div key={p.PaymentId} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-[#080d1a]/50 border border-white/[0.04] hover:border-blue-500/20 hover:bg-[#0d1324]/40 transition-all gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                                <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-white font-semibold text-sm truncate flex items-center gap-2">
                                  {p.BuyerName || p.CompanyName || "Generic Brand"}
                                  {p.CompanyEmail && <span className="text-[10px] text-slate-500 font-normal">({p.CompanyEmail})</span>}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                                  <span className="text-cyan-400 font-bold tracking-tight text-[10px]">PAY-{p.PaymentId}</span>
                                  <span className="text-slate-600">·</span>
                                  <span className="flex items-center gap-1">
                                    {p.PaymentType === 'ASSET' ? <Box className="w-3.5 h-3.5 text-purple-400 shrink-0" /> : <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                                    <span className="truncate">{p.ProjectName || p.AssetName || (p.PaymentType === 'ASSET' ? 'Marketplace Asset' : 'Creative Project')}</span>
                                  </span>
                                  <span className="text-slate-600">·</span>
                                  <span className="text-slate-500 font-mono text-[10px]">
                                    {p.OrderId ? `CR-${p.OrderId}` : p.MpOrderId ? `MP-${p.MpOrderId}` : "—"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-white/[0.04] pt-3.5 md:pt-0">
                              <div className="flex flex-col items-end">
                                <span className="text-emerald-400 font-bold text-base">{fmt(p.Amount)}</span>
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                  <Calendar className="w-3 h-3" />
                                  {p.PaymentDate ? new Date(p.PaymentDate).toLocaleDateString("vi-VN") : "—"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action panel */}
                <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                  <CardHeader className="pb-3"><CardTitle className="text-white text-base font-bold">Download Reports</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2.5">
                    {["Revenue Statement (PDF)", "Dispatch Analytics (CSV)", "Audit Ledger (Excel)"].map(label => (
                      <Button key={label} variant="outline" className="border-white/[0.08] hover:border-purple-500/30 text-slate-300 hover:text-purple-400 rounded-xl text-xs font-bold bg-[#0d1324]/30">
                        <Download className="w-4 h-4 mr-2" /> {label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ===== ORDERS ===== */}
            {activeTab === "orders" && <OrdersTab artists={artists} />}

            {/* ===== CATALOG MANAGEMENT ===== */}
            {activeTab === "catalog" && (
              <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                <CardHeader className="border-b border-white/[0.06] pb-4 bg-white/[0.01]">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-400 shrink-0" />
                        Asset Catalog
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs">
                        Audit upload queues, approve artist assets, and regulate prices
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingAssets > 0 && (
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                          {pendingAssets} pending
                        </Badge>
                      )}
                      <Button onClick={fetchAssets} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02]" disabled={assetsLoading}>
                        <RefreshCw className={`w-3.5 h-3.5 ${assetsLoading ? "animate-spin" : ""}`} />
                      </Button>
                    </div>
                  </div>

                  {/* Publish Status filter */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {["ALL", "DRAFT", "PENDING", "PUBLISHED", "REJECTED"].map(s => {
                      const label = s === "ALL" ? "All Statuses" : ASSET_PUBLISH_CONFIG[s]?.label ?? s;
                      const active = filterPublish === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setFilterPublish(s)}
                          className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                            active
                              ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/10"
                              : "border-white/[0.06] bg-white/[0.01] text-slate-400 hover:border-slate-500"
                          }`}
                        >
                          {label}
                          {s !== "ALL" && <span className="ml-1 opacity-50">({assets.filter(a => a.PublishStatus === s).length})</span>}
                        </button>
                      );
                    })}
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  {assetsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                  ) : assetsError ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <p className="text-rose-400 text-xs">{assetsError}</p>
                      <Button onClick={fetchAssets} variant="outline" className="border-white/[0.08] text-slate-300">Retry</Button>
                    </div>
                  ) : filteredAssets.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
                      <Box className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-semibold">No assets found matching filters</p>
                    </div>
                  ) : (
                    <div className="max-h-[480px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
                      {filteredAssets.map(asset => {
                        const publishCfg = ASSET_PUBLISH_CONFIG[asset.PublishStatus] ?? { label: asset.PublishStatus, color: "bg-slate-600/10 text-slate-300 border-slate-500/20" };
                        return (
                          <div key={asset.AssetId} className="flex items-center justify-between p-4 rounded-xl bg-[#080d1a]/50 border border-white/[0.04] hover:border-purple-500/20 hover:bg-[#0d1324]/40 transition-all gap-4">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-white font-semibold text-sm truncate">{asset.AssetName}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${publishCfg.color}`}>
                                  {publishCfg.label}
                                </span>
                                {asset.Category && (
                                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                    {asset.Category}
                                  </span>
                                )}
                                {Number(asset.IsMarketplace) === 1 && (
                                  <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                    Marketplace Store
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400"><Tag className="w-3 h-3" />#{asset.AssetId}</span>
                                <span>·</span>
                                {asset.Industry && <span>{asset.Industry}</span>}
                                {asset.Industry && <span>·</span>}
                                {asset.Price != null && <span className="text-emerald-400 font-semibold">${asset.Price.toLocaleString()}</span>}
                                {asset.Price != null && <span>·</span>}
                                <span>Registered {new Date(asset.CreatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {asset.PublishStatus === "PENDING" && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-8 px-3"
                                  onClick={() => setEditingAsset(asset)}>
                                  Approve
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/5 text-slate-300 hover:text-purple-400 rounded-xl h-8 w-8 p-0"
                                onClick={() => setEditingAsset(asset)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ===== COMPANIES ===== */}
            {activeTab === "companies" && (
              <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                <CardHeader className="border-b border-white/[0.06] pb-4 bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-400 shrink-0" />
                        Client Accounts
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Register and moderate brand corporate profiles</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={fetchCompanies} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02]" disabled={companiesLoading}>
                        <RefreshCw className={`w-3.5 h-3.5 ${companiesLoading ? "animate-spin" : ""}`} />
                      </Button>
                      <Button onClick={() => setCompanyModal({ open: true, company: null })} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl h-9">
                        <Plus className="w-4 h-4 mr-1.5" /> Add Company
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {companiesLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
                  ) : companiesError ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <p className="text-rose-400 text-xs">{companiesError}</p>
                      <Button onClick={fetchCompanies} variant="outline" className="border-white/[0.08] text-slate-300">Retry</Button>
                    </div>
                  ) : companies.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
                      <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-semibold">No registered companies</p>
                      <Button onClick={() => setCompanyModal({ open: true, company: null })} className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs rounded-xl font-bold">
                        <Plus className="w-4 h-4 mr-1.5" /> Add First Company
                      </Button>
                    </div>
                  ) : (
                    <div className="max-h-[480px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
                      {companies.map(company => {
                        const sCfg = getCompanyStatusCfg(String(company.Status ?? ""));
                        return (
                          <div key={company.CompanyId} className="flex items-center justify-between p-4 rounded-xl bg-[#080d1a]/50 border border-white/[0.04] hover:border-indigo-500/20 hover:bg-[#0d1324]/40 transition-all gap-4">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-white font-semibold text-sm truncate">{company.CompanyName}</p>
                                {company.CompanyType && (
                                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                                    {String(company.CompanyType)}
                                  </span>
                                )}
                                {sCfg && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sCfg.color}`}>{sCfg.label}</span>}
                              </div>
                              <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 font-medium">
                                {company.Email && <span className="text-slate-400">{company.Email}</span>}
                                {company.Phone && <span>·</span>}
                                {company.Phone && <span>{company.Phone}</span>}
                                {company.Address && <span>·</span>}
                                {company.Address && <span className="truncate">{company.Address}</span>}
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="border-white/[0.08] hover:border-indigo-500/30 hover:bg-indigo-500/5 text-slate-300 hover:text-indigo-400 rounded-xl h-8 w-8 p-0 shrink-0"
                              onClick={() => setCompanyModal({ open: true, company })}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ===== TEAM ===== */}
            {activeTab === "team" && (
              <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
                <CardHeader className="border-b border-white/[0.06] pb-4 bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-pink-400 shrink-0" />
                        Artist Directory
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs">Verify work states and assign logs for active 3D artists</CardDescription>
                    </div>
                    <Button onClick={fetchArtists} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02]" disabled={artistsLoading}>
                      <RefreshCw className={`w-3.5 h-3.5 ${artistsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {artistsLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
                  ) : artistsError ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <AlertCircle className="w-8 h-8 text-rose-400" />
                      <p className="text-rose-400 text-xs">{artistsError}</p>
                      <Button onClick={fetchArtists} variant="outline" className="border-white/[0.08] text-slate-300">Retry</Button>
                    </div>
                  ) : artists.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
                      <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm font-semibold">No artists registered in the system</p>
                    </div>
                  ) : (
                    <div className="max-h-[480px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
                      {artists.map(artist => (
                        <div key={artist.UserId} className="flex items-center justify-between p-4 rounded-xl bg-[#080d1a]/50 border border-white/[0.04] hover:border-pink-500/20 hover:bg-[#0d1324]/40 transition-all gap-4">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300 font-extrabold text-sm flex-shrink-0">
                              {artist.UserName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{artist.UserName}</p>
                              <p className="text-slate-400 text-xs truncate mt-0.5">{artist.Email ?? "No email address registered"}</p>
                              {artist.Phone && <p className="text-slate-500 text-[10px] mt-1 font-mono font-medium">{artist.Phone}</p>}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 border ${
                            artist.IsActive
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}>
                            {artist.IsActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {companyModal.open && (
          <CompanyModal
            company={companyModal.company}
            onClose={() => setCompanyModal({ open: false, company: null })}
            onSave={() => { setCompanyModal({ open: false, company: null }); fetchCompanies(); }}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {editingAsset && (
          <AssetEditModal
            asset={editingAsset}
            onClose={() => setEditingAsset(null)}
            onSave={() => { setEditingAsset(null); fetchAssets(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}