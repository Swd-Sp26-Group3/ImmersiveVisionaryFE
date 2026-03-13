"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  TrendingUp, Users, Package, DollarSign, BarChart3,
  Settings, Download, Plus, Edit, Trash2, Loader2,
  AlertCircle, Building2, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { apiFetch } from "@/lib/api";
import { Artist, Company, CreativeOrder, Product } from "./components/type";
import { ProductModal } from "./components/ProductModal";
import { CompanyModal } from "./components/CompanyModal";
import { OrdersTab } from "./components/OrdersTab";

// ===================== Local constants (không import từ type.ts) =====================
const COMPANY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Active",    color: "bg-green-600"  },
  INACTIVE:  { label: "Inactive",  color: "bg-slate-600"  },
  SUSPENDED: { label: "Suspended", color: "bg-red-600"    },
};

// Null-safe lookup
const getCompanyStatusCfg = (status: string | null | undefined) => {
  if (!status) return null;
  return COMPANY_STATUS_CONFIG[status] ?? null;
};

// Payment interface (khớp BE paymentService)
interface Payment {
  PaymentId: number;
  OrderId: number | null;
  AssetId: number | null;
  CompanyId: number;
  Amount: number;
  PaymentType: string | null;
  PaymentStatus: "PENDING" | "PAID" | "FAILED";
  PaymentDate: string | null;
}

// Tab definition
const TABS = [
  { id: "overview",  label: "Overview",   icon: BarChart3 },
  { id: "orders",    label: "Orders",     icon: Package   },
  { id: "companies", label: "Companies",  icon: Building2 },
  { id: "catalog",   label: "MarketPlace",icon: Settings  },
  { id: "team",      label: "Team",       icon: Users     },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Products
  const [products, setProducts]             = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError]     = useState("");
  const [productModal, setProductModal]     = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [deletingId, setDeletingId]         = useState<number | null>(null);

  // Companies
  const [companies, setCompanies]               = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError]     = useState("");
  const [companyModal, setCompanyModal]         = useState<{ open: boolean; company: Company | null }>({ open: false, company: null });

  // Artists
  const [artists, setArtists]               = useState<Artist[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [artistsError, setArtistsError]     = useState("");

  // Orders (stats + overview charts)
  const [orders, setOrders]               = useState<CreativeOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Payments (revenue)
  const [payments, setPayments]               = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // ===================== Fetch =====================
  const fetchCatalog = () => {
    setCatalogLoading(true); setCatalogError("");
    apiFetch("/products")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setProducts(d.data ?? d))
      .catch(() => setCatalogError("Cannot load catalog."))
      .finally(() => setCatalogLoading(false));
  };

  const fetchCompanies = () => {
    setCompaniesLoading(true); setCompaniesError("");
    apiFetch("/companies")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setCompanies(d.data ?? d))
      .catch(() => setCompaniesError("Cannot load companies."))
      .finally(() => setCompaniesLoading(false));
  };

  const fetchArtists = () => {
    setArtistsLoading(true); setArtistsError("");
    apiFetch("/users")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        const all: Artist[] = d.data ?? d;
        setArtists(all.filter((u) => u.RoleName === "ARTIST"));
      })
      .catch(() => setArtistsError("Cannot load artists."))
      .finally(() => setArtistsLoading(false));
  };

  const fetchOrders = () => {
    setOrdersLoading(true);
    apiFetch("/orders")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setOrders(d.data ?? d))
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  };

  const fetchPayments = () => {
    setPaymentsLoading(true);
    apiFetch("/payments") // GET /api/payments — ADMIN/MANAGER sees all
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setPayments(d.data ?? d))
      .catch(() => setPayments([]))
      .finally(() => setPaymentsLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
    fetchCompanies();
    fetchArtists();
    fetchOrders();
    fetchPayments();
  }, []);

  // ===================== Handlers =====================
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(productId);
    try {
      const res = await apiFetch(`/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => p.ProductId !== productId));
    } catch {
      alert("Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  // ===================== Revenue calculations from real payments =====================
  // Chỉ tính payments có PaymentStatus === "PAID"
  const paidPayments = payments.filter((p) => p.PaymentStatus === "PAID");
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.Amount ?? 0), 0);

  // Group by month for line chart — dùng PaymentDate
  const revenueByMonth = paidPayments.reduce((acc, p) => {
    if (!p.PaymentDate) return acc;
    const month = new Date(p.PaymentDate).toLocaleString("en-US", { month: "short" });
    acc[month] = (acc[month] ?? 0) + (p.Amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  // Sắp xếp theo tháng trong năm
  const MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const revenueData = MONTH_ORDER
    .filter((m) => revenueByMonth[m] !== undefined)
    .map((month) => ({ month, revenue: revenueByMonth[month] }));

  // Fallback: nếu không có payment nào thì chart vẫn hiện placeholder
  const chartData = revenueData.length > 0 ? revenueData : [
    { month: "—", revenue: 0 },
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  // ===================== Other chart data =====================
  const orderStatusData = [
    { name: "Completed",   value: orders.filter((o) => o.Status === "COMPLETED").length,     color: "#10b981" },
    { name: "In Progress", value: orders.filter((o) => o.Status === "IN_PRODUCTION").length,  color: "#3b82f6" },
    { name: "New",         value: orders.filter((o) => o.Status === "NEW").length,            color: "#f59e0b" },
    { name: "Review",      value: orders.filter((o) => o.Status === "REVIEW").length,         color: "#a855f7" },
  ].filter((d) => d.value > 0);

  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      const cat = p.Category ?? "Other";
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  const newOrderCount = orders.filter((o) => o.Status === "NEW").length;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Manager Dashboard</h1>
            <p className="text-gray-400">Monitor performance, manage catalog, companies, and assign tasks</p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">

          {/* Total Revenue — từ payments PAID */}
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Total Revenue</CardTitle>
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
                  <p className="text-xs text-cyan-400 mt-1">{paidPayments.length} paid transactions</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Active Orders</CardTitle>
                <Package className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">
                    {orders.filter((o) =>
                      o.Status !== "COMPLETED" && o.Status !== "DELIVERED" && o.Status !== "CANCELLED"
                    ).length}
                  </div>
                  <p className="text-xs text-green-400 mt-1">{newOrderCount} unassigned</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Companies */}
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Companies</CardTitle>
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              {companiesLoading ? (
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{companies.length}</div>
                  <p className="text-xs text-purple-400 mt-1">
                    {companies.filter((c) => String(c.Status) === "ACTIVE").length} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Artists */}
          <Card className="bg-gradient-to-br from-pink-600/20 to-rose-600/20 border-pink-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Artists</CardTitle>
                <Users className="w-5 h-5 text-pink-400" />
              </div>
            </CardHeader>
            <CardContent>
              {artistsLoading ? (
                <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{artists.length}</div>
                  <p className="text-xs text-pink-400 mt-1">
                    {artists.filter((a) => a.IsActive).length} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Catalog Items */}
          <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Catalog Items</CardTitle>
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              {catalogLoading ? (
                <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{products.length}</div>
                  <p className="text-xs text-yellow-400 mt-1">Active products</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Custom Tabs */}
        <div className="space-y-6">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-800/50 w-fit flex-wrap">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {id === "orders" && newOrderCount > 0 && (
                    <span className="ml-1 bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                      {newOrderCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ===== OVERVIEW ===== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">

                {/* Revenue Trend — real data từ payments */}
                <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">Revenue Trend</CardTitle>
                        <CardDescription className="text-gray-400">
                          Monthly revenue from PAID transactions
                        </CardDescription>
                      </div>
                      {paymentsLoading && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis
                          stroke="#94a3b8"
                          tickFormatter={(v) => formatCurrency(v)}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }}
                          formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Order Status Pie */}
                <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Order Status</CardTitle>
                    <CardDescription className="text-gray-400">Current breakdown (live)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="flex items-center justify-center h-[250px]">
                        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                      </div>
                    ) : orderStatusData.length === 0 ? (
                      <div className="flex items-center justify-center h-[250px] text-slate-500">
                        No orders yet
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={orderStatusData}
                            cx="50%" cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {orderStatusData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Category Bar Chart */}
              {categoryData.length > 0 && (
                <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="text-white">Catalog by Category</CardTitle>
                    <CardDescription className="text-gray-400">Products per category (live)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="category" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                        <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Payments summary table */}
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Recent Payments</CardTitle>
                      <CardDescription className="text-gray-400">
                        Latest paid transactions — total {formatCurrency(totalRevenue)}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={fetchPayments}
                      variant="outline" size="sm"
                      className="border-slate-600 text-slate-300"
                      disabled={paymentsLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${paymentsLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {paymentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                  ) : paidPayments.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No paid transactions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {paidPayments.slice(0, 8).map((payment) => (
                        <div
                          key={payment.PaymentId}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-blue-500/10"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">
                                Payment #{payment.PaymentId}
                                {payment.PaymentType && (
                                  <span className="ml-2 text-xs text-slate-400">({payment.PaymentType})</span>
                                )}
                              </p>
                              <p className="text-slate-500 text-xs">
                                {payment.OrderId ? `Order #${payment.OrderId}` : payment.AssetId ? `Asset #${payment.AssetId}` : "—"}
                                {payment.PaymentDate && (
                                  <span className="ml-2">
                                    {new Date(payment.PaymentDate).toLocaleDateString()}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600/80 text-xs">PAID</Badge>
                            <span className="text-green-400 font-semibold text-sm">
                              {formatCurrency(payment.Amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                      {paidPayments.length > 8 && (
                        <p className="text-center text-slate-500 text-xs pt-2">
                          +{paidPayments.length - 8} more transactions
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export */}
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Export Reports</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {["Revenue Report (PDF)", "Team Performance (CSV)", "Order Summary (Excel)"].map((label) => (
                    <Button key={label} variant="outline" className="border-blue-500/50 text-slate-300">
                      <Download className="w-4 h-4 mr-2" /> {label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ===== ORDERS ===== */}
          {activeTab === "orders" && (
            <OrdersTab artists={artists} />
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
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
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
                    {companies.map((company) => {
                      // ✅ String() cast để handle cả enum value và string value
                      const statusCfg = getCompanyStatusCfg(String(company.Status ?? ""));
                      return (
                        <div key={company.CompanyId} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium truncate">{company.CompanyName}</p>
                              {company.CompanyType && (
                                <Badge className="bg-blue-600/80 text-xs flex-shrink-0">
                                  {String(company.CompanyType)}
                                </Badge>
                              )}
                              {statusCfg && (
                                <Badge className={`${statusCfg.color} text-xs flex-shrink-0`}>
                                  {statusCfg.label}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              {company.Email   && <span className="text-xs text-slate-400">{company.Email}</span>}
                              {company.Phone   && <span className="text-xs text-slate-500">• {company.Phone}</span>}
                              {company.Address && <span className="text-xs text-slate-500 truncate">• {company.Address}</span>}
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

          {/* ===== CATALOG ===== */}
          {activeTab === "catalog" && (
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Catalog Management</CardTitle>
                    <CardDescription className="text-gray-400">Add, edit, and delete 3D/AR products</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchCatalog} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={catalogLoading}>
                      <RefreshCw className={`w-4 h-4 ${catalogLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button onClick={() => setProductModal({ open: true, product: null })} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                      <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {catalogLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                ) : catalogError ? (
                  <div className="flex flex-col items-center py-12 gap-3">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                    <p className="text-red-400">{catalogError}</p>
                    <Button onClick={fetchCatalog} variant="outline" className="border-slate-600 text-slate-300">Retry</Button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No products yet.</p>
                    <Button onClick={() => setProductModal({ open: true, product: null })} className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600">
                      <Plus className="w-4 h-4 mr-2" /> Add First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => {
                      const company = companies.find((c) => c.CompanyId === product.CompanyId);
                      return (
                        <div key={product.ProductId} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-medium truncate">{product.ProductName}</p>
                              {product.Category && (
                                <Badge className="bg-blue-600/80 text-xs flex-shrink-0">{product.Category}</Badge>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm truncate">{product.Description ?? "No description"}</p>
                            <div className="flex gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-cyan-500/80">
                                {company ? company.CompanyName : `Company #${product.CompanyId}`}
                              </span>
                              {product.SizeInfo  && <span className="text-xs text-slate-500">Size: {product.SizeInfo}</span>}
                              {product.ColorInfo && <span className="text-xs text-slate-500">Color: {product.ColorInfo}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline" className="border-blue-500/50 text-slate-300"
                              onClick={() => setProductModal({ open: true, product })}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteProduct(product.ProductId)}
                              disabled={deletingId === product.ProductId}>
                              {deletingId === product.ProductId
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />}
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

          {/* ===== TEAM ===== */}
          {activeTab === "team" && (
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Team — Artists</CardTitle>
                    <CardDescription className="text-gray-400">All users with role ARTIST</CardDescription>
                  </div>
                  <Button onClick={fetchArtists} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={artistsLoading}>
                    <RefreshCw className={`w-4 h-4 ${artistsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {artistsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
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
                ) : (
                  artists.map((artist) => (
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
                  ))
                )}
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

      {productModal.open && (
        <ProductModal
          product={productModal.product}
          onClose={() => setProductModal({ open: false, product: null })}
          onSave={() => { setProductModal({ open: false, product: null }); fetchCatalog(); }}
        />
      )}
    </div>
  );
}