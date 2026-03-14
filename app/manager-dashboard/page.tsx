"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  TrendingUp, Users, Package, DollarSign, BarChart3,
  Download, Loader2, AlertCircle, Building2, RefreshCw,
  ShoppingBag, Box, Tag, Edit, Trash2, Plus, Eye,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { Artist, Company, CreativeOrder, Product } from "./components/type";
import { CompanyModal } from "./components/CompanyModal";
import { OrdersTab } from "./components/OrdersTab";

// ===================== Types =====================
const COMPANY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Active",    color: "bg-green-600"  },
  INACTIVE:  { label: "Inactive",  color: "bg-slate-600"  },
  SUSPENDED: { label: "Suspended", color: "bg-red-600"    },
};
const getCompanyStatusCfg = (s: string | null | undefined) =>
  s ? (COMPANY_STATUS_CONFIG[s] ?? null) : null;

interface Payment {
  PaymentId: number; OrderId: number | null; AssetId: number | null;
  CompanyId: number; Amount: number; PaymentType: string | null;
  PaymentStatus: "PENDING" | "PAID" | "FAILED"; PaymentDate: string | null;
}

// Asset3D — đây mới là "platform assets" trong Catalog Management
interface Asset {
  AssetId: number; AssetName: string; Description: string | null;
  Category: string | null; Industry: string | null;
  Price: number | null; PreviewImage: string | null;
  PublishStatus: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  IsMarketplace: boolean | number; AssetType: string | null;
  CreatedAt: string;
}

const ASSET_PUBLISH_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT:     { label: "Draft",     color: "bg-slate-600"   },
  PENDING:   { label: "Pending",   color: "bg-yellow-600"  },
  PUBLISHED: { label: "Published", color: "bg-green-600"   },
  REJECTED:  { label: "Rejected",  color: "bg-red-600"     },
};

// ===================== Tabs (theo flow diagram) =====================
const TABS = [
  { id: "overview",  label: "Overview",          icon: BarChart3  },
  { id: "orders",    label: "Orders",             icon: Package    },
  { id: "catalog",   label: "Catalog Mgmt",       icon: Box        },
  { id: "companies", label: "Companies",          icon: Building2  },
  { id: "team",      label: "Team",               icon: Users      },
] as const;
type TabId = typeof TABS[number]["id"];

// ===================== Asset Edit Modal =====================
function AssetEditModal({
  asset, onClose, onSave,
}: {
  asset: Asset;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    AssetName:   asset.AssetName,
    Description: asset.Description ?? "",
    Category:    asset.Category    ?? "",
    Industry:    asset.Industry    ?? "",
    Price:       asset.Price?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    if (!form.AssetName.trim()) { setError("Asset name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await apiFetch(`/assets/${asset.AssetId}`, {
        method: "PUT",
        body: JSON.stringify({
          AssetName:   form.AssetName   || undefined,
          Description: form.Description || null,
          Category:    form.Category    || null,
          Industry:    form.Industry    || null,
          Price:       form.Price ? Number(form.Price) : null,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/30 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-white font-bold">Edit Asset</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {[
            { label: "Asset Name *", key: "AssetName",   placeholder: "e.g. Luxury Bag 3D" },
            { label: "Category",     key: "Category",    placeholder: "e.g. Fashion" },
            { label: "Industry",     key: "Industry",    placeholder: "e.g. Retail" },
            { label: "Price ($)",    key: "Price",       placeholder: "e.g. 299" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-white text-sm">{label}</label>
              <input
                value={form[key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-white text-sm">Description</label>
            <textarea
              value={form.Description}
              onChange={e => setForm(p => ({ ...p, Description: e.target.value }))}
              rows={3}
              placeholder="Asset description..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>
        <div className="flex gap-2 p-5 border-t border-slate-700">
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-600 text-slate-300">Cancel</Button>
          {asset.PublishStatus === "PENDING" && (
            <Button onClick={handleApprove} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              ✓ Approve
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===================== Main Dashboard =====================
export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Assets (Catalog = platform Asset3D list)
  const [assets, setAssets]           = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError,   setAssetsError]   = useState("");
  const [editingAsset,  setEditingAsset]  = useState<Asset | null>(null);
  const [filterPublish, setFilterPublish] = useState("ALL");

  // Companies
  const [companies, setCompanies]               = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError,   setCompaniesError]   = useState("");
  const [companyModal, setCompanyModal]         = useState<{ open: boolean; company: Company | null }>({ open: false, company: null });

  // Artists
  const [artists, setArtists]               = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistsError,   setArtistsError]   = useState("");

  // Orders (for stats only)
  const [orders, setOrders]               = useState<CreativeOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Payments (revenue)
  const [payments, setPayments]               = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // ===================== Fetch =====================
  const fetchAssets = () => {
    setAssetsLoading(true); setAssetsError("");
    // Manager lấy tất cả assets (không chỉ marketplace) — dùng một endpoint admin hoặc filter
    // Hiện tại dùng /assets/marketplace để xem published, nhưng manager cần thấy cả DRAFT/PENDING
    // Nếu BE có GET /assets (list all) dùng đó, tạm thời dùng /assets/marketplace
    apiFetch("/assets/marketplace")
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
  const paidPayments  = payments.filter(p => p.PaymentStatus === "PAID");
  const totalRevenue  = paidPayments.reduce((s, p) => s + (p.Amount ?? 0), 0);
  const revenueByMonth = paidPayments.reduce((acc, p) => {
    if (!p.PaymentDate) return acc;
    const m = new Date(p.PaymentDate).toLocaleString("en-US", { month: "short" });
    acc[m] = (acc[m] ?? 0) + (p.Amount ?? 0);
    return acc;
  }, {} as Record<string, number>);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const chartData = MONTHS.filter(m => revenueByMonth[m]).map(m => ({ month: m, revenue: revenueByMonth[m] }));
  const fmt = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(1)}K` : `$${n.toFixed(0)}`;

  const orderStatusData = [
    { name: "New",         value: orders.filter(o => o.Status === "NEW").length,           color: "#f59e0b" },
    { name: "In Progress", value: orders.filter(o => o.Status === "IN_PRODUCTION").length,  color: "#3b82f6" },
    { name: "Review",      value: orders.filter(o => o.Status === "REVIEW").length,         color: "#a855f7" },
    { name: "Completed",   value: orders.filter(o => o.Status === "COMPLETED").length,      color: "#10b981" },
  ].filter(d => d.value > 0);

  const newOrderCount  = orders.filter(o => o.Status === "NEW").length;
  const activeOrders   = orders.filter(o => !["COMPLETED","DELIVERED","CANCELLED"].includes(o.Status)).length;

  const filteredAssets = filterPublish === "ALL" ? assets : assets.filter(a => a.PublishStatus === filterPublish);
  const pendingAssets  = assets.filter(a => a.PublishStatus === "PENDING").length;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Manager Dashboard</h1>
          <p className="text-gray-400">Monitor performance · Manage catalog · Assign tasks to artists</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: paymentsLoading ? null : fmt(totalRevenue), sub: `${paidPayments.length} paid`, color: "from-blue-600/20 to-cyan-600/20 border-blue-500/30", icon: DollarSign, iconColor: "text-cyan-400" },
            { label: "Active Orders", value: ordersLoading ? null : activeOrders,        sub: `${newOrderCount} unassigned`, color: "from-green-600/20 to-emerald-600/20 border-green-500/30", icon: Package, iconColor: "text-green-400" },
            { label: "Companies",     value: companiesLoading ? null : companies.length, sub: `${companies.filter(c => String(c.Status) === "ACTIVE").length} active`, color: "from-purple-600/20 to-pink-600/20 border-purple-500/30", icon: Building2, iconColor: "text-purple-400" },
            { label: "Artists",       value: artistsLoading ? null : artists.length,     sub: `${artists.filter(a => a.IsActive).length} active`, color: "from-pink-600/20 to-rose-600/20 border-pink-500/30", icon: Users, iconColor: "text-pink-400" },
            { label: "Catalog Assets",value: assetsLoading ? null : assets.length,      sub: pendingAssets > 0 ? `${pendingAssets} pending review` : "All reviewed", color: "from-yellow-600/20 to-orange-600/20 border-yellow-500/30", icon: Box, iconColor: "text-yellow-400" },
          ].map(({ label, value, sub, color, icon: Icon, iconColor }) => (
            <Card key={label} className={`bg-gradient-to-br ${color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-gray-300">{label}</CardTitle>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              </CardHeader>
              <CardContent>
                {value === null
                  ? <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
                  : <><div className="text-3xl font-bold text-white">{value}</div>
                     <p className={`text-xs ${iconColor} mt-1`}>{sub}</p></>
                }
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab nav */}
        <div className="space-y-6">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 w-fit flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === "orders" && newOrderCount > 0 && (
                    <span className="ml-1 bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{newOrderCount}</span>
                  )}
                  {id === "catalog" && pendingAssets > 0 && (
                    <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">{pendingAssets}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Revenue Trend</CardTitle>
                        <CardDescription className="text-gray-400">Monthly PAID transactions</CardDescription>
                      </div>
                      {paymentsLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData.length > 0 ? chartData : [{ month: "—", revenue: 0 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={fmt} />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }}
                          formatter={(v: number | undefined) => [`$${v ?? 0}`, "Revenue"]} />
                        <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Order Status</CardTitle>
                    <CardDescription className="text-gray-400">Creative orders breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="flex items-center justify-center h-[250px]"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
                    ) : orderStatusData.length === 0 ? (
                      <div className="flex items-center justify-center h-[250px] text-slate-500">No orders yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={orderStatusData} cx="50%" cy="50%" labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80} dataKey="value">
                            {orderStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Payments */}
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Recent Payments</CardTitle>
                      <CardDescription className="text-gray-400">Latest paid — total {fmt(totalRevenue)}</CardDescription>
                    </div>
                    <Button onClick={fetchPayments} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={paymentsLoading}>
                      <RefreshCw className={`w-4 h-4 ${paymentsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
                  ) : paidPayments.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No paid transactions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {paidPayments.slice(0, 8).map(p => (
                        <div key={p.PaymentId} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                Payment #{p.PaymentId}
                                {p.PaymentType && <span className="ml-2 text-xs text-slate-400">({p.PaymentType})</span>}
                              </p>
                              <p className="text-slate-500 text-xs">
                                {p.OrderId ? `Order #${p.OrderId}` : p.AssetId ? `Asset #${p.AssetId}` : "—"}
                                {p.PaymentDate && <span className="ml-2">{new Date(p.PaymentDate).toLocaleDateString()}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600/80 text-xs">PAID</Badge>
                            <span className="text-green-400 font-semibold text-sm">{fmt(p.Amount)}</span>
                          </div>
                        </div>
                      ))}
                      {paidPayments.length > 8 && (
                        <p className="text-center text-slate-500 text-xs pt-2">+{paidPayments.length - 8} more</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader><CardTitle className="text-white">Export Reports</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {["Revenue Report (PDF)", "Team Performance (CSV)", "Order Summary (Excel)"].map(label => (
                    <Button key={label} variant="outline" className="border-blue-500/50 text-slate-300">
                      <Download className="w-4 h-4 mr-2" /> {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== ORDERS — Creative + Marketplace (OrdersTab) ===== */}
          {activeTab === "orders" && <OrdersTab artists={artists} />}

          {/* ===== CATALOG MANAGEMENT — Asset3D (platform assets) ===== */}
          {activeTab === "catalog" && (
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Box className="w-5 h-5 text-cyan-400" />
                      Catalog Management
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-1">
                      Platform 3D/AR assets — review, approve, update pricing
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingAssets > 0 && (
                      <Badge className="bg-orange-600/80">{pendingAssets} pending review</Badge>
                    )}
                    <Button onClick={fetchAssets} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={assetsLoading}>
                      <RefreshCw className={`w-4 h-4 ${assetsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Publish status filter */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {["ALL", "DRAFT", "PENDING", "PUBLISHED", "REJECTED"].map(s => (
                    <button key={s} onClick={() => setFilterPublish(s)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        filterPublish === s
                          ? "bg-cyan-600 border-cyan-600 text-white"
                          : "border-slate-600 text-slate-400 hover:border-slate-400"
                      }`}
                    >
                      {s === "ALL" ? "All" : ASSET_PUBLISH_CONFIG[s]?.label ?? s}
                      {s !== "ALL" && <span className="ml-1 opacity-60">({assets.filter(a => a.PublishStatus === s).length})</span>}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                {assetsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                ) : assetsError ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-red-400 text-sm">{assetsError}</p>
                    <Button onClick={fetchAssets} variant="outline" className="border-slate-600 text-slate-300">Retry</Button>
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div className="text-center py-12">
                    <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No assets found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAssets.map(asset => {
                      const publishCfg = ASSET_PUBLISH_CONFIG[asset.PublishStatus] ?? { label: asset.PublishStatus, color: "bg-slate-600" };
                      return (
                        <div key={asset.AssetId} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-white font-medium truncate">{asset.AssetName}</p>
                              <Badge className={`${publishCfg.color} text-xs flex-shrink-0`}>{publishCfg.label}</Badge>
                              {asset.Category && <Badge className="bg-blue-600/80 text-xs flex-shrink-0">{asset.Category}</Badge>}
                              {Number(asset.IsMarketplace) === 1 && (
                                <Badge className="bg-purple-600/80 text-xs flex-shrink-0">Marketplace</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />#{asset.AssetId}</span>
                              {asset.Industry && <span>{asset.Industry}</span>}
                              {asset.Price != null && <span className="text-green-400">${asset.Price.toLocaleString()}</span>}
                              <span>{new Date(asset.CreatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {asset.PublishStatus === "PENDING" && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                onClick={() => setEditingAsset(asset)}>
                                Review
                              </Button>
                            )}
                            <Button size="sm" variant="outline" className="border-blue-500/50 text-slate-300"
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
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Company Management</CardTitle>
                    <CardDescription className="text-gray-400">Create and manage client companies</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchCompanies} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={companiesLoading}>
                      <RefreshCw className={`w-4 h-4 ${companiesLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={() => setCompanyModal({ open: true, company: null })} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                      <Plus className="w-4 h-4 mr-2" /> Add Company
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {companiesLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
                ) : companiesError ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-red-400">{companiesError}</p>
                    <Button onClick={fetchCompanies} variant="outline" className="border-slate-600 text-slate-300">Retry</Button>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No companies yet.</p>
                    <Button onClick={() => setCompanyModal({ open: true, company: null })} className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                      <Plus className="w-4 h-4 mr-2" /> Add First Company
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {companies.map(company => {
                      const sCfg = getCompanyStatusCfg(String(company.Status ?? ""));
                      return (
                        <div key={company.CompanyId} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium truncate">{company.CompanyName}</p>
                              {company.CompanyType && <Badge className="bg-blue-600/80 text-xs">{String(company.CompanyType)}</Badge>}
                              {sCfg && <Badge className={`${sCfg.color} text-xs`}>{sCfg.label}</Badge>}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-xs">
                              {company.Email   && <span className="text-slate-400">{company.Email}</span>}
                              {company.Phone   && <span className="text-slate-500">· {company.Phone}</span>}
                              {company.Address && <span className="text-slate-500 truncate">· {company.Address}</span>}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="border-blue-500/50 text-slate-300 ml-4"
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
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Team — 3D Artists</CardTitle>
                    <CardDescription className="text-gray-400">All users with role ARTIST</CardDescription>
                  </div>
                  <Button onClick={fetchArtists} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={artistsLoading}>
                    <RefreshCw className={`w-4 h-4 ${artistsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {artistsLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-cyan-400 animate-spin" /></div>
                ) : artistsError ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-red-400">{artistsError}</p>
                    <Button onClick={fetchArtists} variant="outline" className="border-slate-600 text-slate-300">Retry</Button>
                  </div>
                ) : artists.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No artists found.</p>
                  </div>
                ) : artists.map(artist => (
                  <div key={artist.UserId} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        {artist.UserName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{artist.UserName}</p>
                        <p className="text-slate-400 text-sm">{artist.Email ?? "No email"}</p>
                        {artist.Phone && <p className="text-slate-500 text-xs">{artist.Phone}</p>}
                      </div>
                    </div>
                    <Badge className={artist.IsActive ? "bg-green-600" : "bg-slate-600"}>
                      {artist.IsActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      {companyModal.open && (
        <CompanyModal
          company={companyModal.company}
          onClose={() => setCompanyModal({ open: false, company: null })}
          onSave={() => { setCompanyModal({ open: false, company: null }); fetchCompanies(); }}
        />
      )}
      {editingAsset && (
        <AssetEditModal
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSave={() => { setEditingAsset(null); fetchAssets(); }}
        />
      )}
    </div>
  );
}