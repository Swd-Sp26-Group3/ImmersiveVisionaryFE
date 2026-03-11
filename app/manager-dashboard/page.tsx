"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import {
  TrendingUp, Users, Package, DollarSign, BarChart3,
  Settings, Download, Plus, Edit, Trash2, Loader2,
  AlertCircle, CheckCircle2, Clock, Eye, UserCheck,
  X, Save, RefreshCw
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ✅ Interfaces khớp với BE productService
interface Product {
  ProductId: number;
  ProductName: string;
  Description: string | null;
  Category: string | null;
  SizeInfo: string | null;
  ColorInfo: string | null;
  CompanyId: number;
  CreatedAt: string;
  UpdatedAt: string | null;
}

// Mock orders — thay bằng API /api/orders khi BE có
const MOCK_ORDERS = [
  { id: "ORD-001", title: "Luxury Perfume AR Campaign", company: "Chanel VN", status: "NEW", assignedTo: null, createdAt: "2026-03-01" },
  { id: "ORD-002", title: "Fashion Collection Showcase", company: "Zara SEA", status: "IN_PRODUCTION", assignedTo: "John D.", createdAt: "2026-02-28" },
  { id: "ORD-003", title: "Food Menu 3D Visualization", company: "Grab Food", status: "REVIEW", assignedTo: "Sarah M.", createdAt: "2026-02-25" },
  { id: "ORD-004", title: "Smart Watch AR Demo", company: "Samsung VN", status: "COMPLETED", assignedTo: "Mike R.", createdAt: "2026-02-20" },
  { id: "ORD-005", title: "Furniture Placement AR", company: "IKEA VN", status: "NEW", assignedTo: null, createdAt: "2026-03-02" },
];

const MOCK_ARTISTS = [
  { id: 1, name: "John D.", specialty: "3D Modeling", activeOrders: 2 },
  { id: 2, name: "Sarah M.", specialty: "AR/VR", activeOrders: 1 },
  { id: 3, name: "Mike R.", specialty: "Post-Production", activeOrders: 3 },
  { id: 4, name: "Emma L.", specialty: "3D Animation", activeOrders: 1 },
];

// Status badge config
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: "New", color: "bg-yellow-600" },
  IN_PRODUCTION: { label: "In Production", color: "bg-blue-600" },
  REVIEW: { label: "Review", color: "bg-purple-600" },
  COMPLETED: { label: "Completed", color: "bg-green-600" },
  DELIVERED: { label: "Delivered", color: "bg-cyan-600" },
  CANCELLED: { label: "Cancelled", color: "bg-red-600" },
};

// ==================== MODAL: Add/Edit Product ====================
function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null; // null = add new
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    ProductName: product?.ProductName ?? "",
    Description: product?.Description ?? "",
    Category: product?.Category ?? "",
    SizeInfo: product?.SizeInfo ?? "",
    ColorInfo: product?.ColorInfo ?? "",
    CompanyId: product?.CompanyId ?? 1,
  });

  const update = (key: keyof typeof form, value: string | number) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    if (!form.ProductName.trim()) {
      setError("Product name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (isEdit) {
        // ✅ PUT /api/products/:id
        const res = await apiFetch(`/products/${product!.ProductId}`, {
          method: "PUT",
          body: JSON.stringify({
            ProductName: form.ProductName,
            Description: form.Description || null,
            Category: form.Category || null,
            SizeInfo: form.SizeInfo || null,
            ColorInfo: form.ColorInfo || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      } else {
        // ✅ POST /api/products
        const res = await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify({
            CompanyId: form.CompanyId,
            ProductName: form.ProductName,
            Description: form.Description || null,
            Category: form.Category || null,
            SizeInfo: form.SizeInfo || null,
            ColorInfo: form.ColorInfo || null,
          }),
        });
        if (!res.ok) throw new Error((await res.json()).message);
      }
      onSave();
    } catch (err: any) {
      setError(err.message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/30 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-white">Product Name *</Label>
            <Input
              value={form.ProductName}
              onChange={(e) => update("ProductName", e.target.value)}
              placeholder="e.g., Luxury Perfume AR"
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Category</Label>
            <Select value={form.Category} onValueChange={(v) => update("Category", v)}>
              <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                {["Cosmetics", "Fashion", "Food & Beverage", "Electronics", "Home Decor", "Other"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white">Description</Label>
            <Textarea
              value={form.Description}
              onChange={(e) => update("Description", e.target.value)}
              placeholder="Product description..."
              rows={3}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white">Size Info</Label>
              <Input
                value={form.SizeInfo}
                onChange={(e) => update("SizeInfo", e.target.value)}
                placeholder="e.g., 30x30x30cm"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Color Info</Label>
              <Input
                value={form.ColorInfo}
                onChange={(e) => update("ColorInfo", e.target.value)}
                placeholder="e.g., Gold, Black"
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== MODAL: Assign Task ====================
function AssignTaskModal({
  order,
  onClose,
  onAssigned,
}: {
  order: (typeof MOCK_ORDERS)[0];
  onClose: () => void;
  onAssigned: (orderId: string, artistName: string) => void;
}) {
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedArtist) return;
    setAssigning(true);
    const artist = MOCK_ARTISTS.find((a) => a.id === selectedArtist)!;

    // Khi BE có /api/orders/:id/assign:
    // await apiFetch(`/orders/${order.id}/assign`, {
    //   method: "POST",
    //   body: JSON.stringify({ artistId: selectedArtist, note }),
    // });

    // Mock delay
    await new Promise((r) => setTimeout(r, 800));
    onAssigned(order.id, artist.name);
    setAssigning(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-blue-500/30 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">Assign Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {/* Order info */}
          <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Order</p>
            <p className="text-white font-medium">{order.title}</p>
            <p className="text-slate-400 text-sm">{order.id} • {order.company}</p>
          </div>

          {/* Artist selection */}
          <div className="space-y-3">
            <Label className="text-white">Select Artist *</Label>
            <div className="space-y-2">
              {MOCK_ARTISTS.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => setSelectedArtist(artist.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                    selectedArtist === artist.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 hover:border-slate-500"
                  }`}
                >
                  <div>
                    <p className="text-white font-medium">{artist.name}</p>
                    <p className="text-slate-400 text-xs">{artist.specialty}</p>
                  </div>
                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                    {artist.activeOrders} active
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-white">Instructions / Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Upload guide or special instructions for the artist..."
              rows={3}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedArtist || assigning}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {assigning ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            Assign Task
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function ManagerDashboard() {
  const router = useRouter();

  // --- Catalog state ---
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [productModal, setProductModal] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- Order state ---
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [assignModal, setAssignModal] = useState<(typeof MOCK_ORDERS)[0] | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // ✅ Fetch catalog từ API thật
  const fetchCatalog = () => {
    setCatalogLoading(true);
    setCatalogError("");
    apiFetch("/products") // GET /api/products
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => setProducts(data.data ?? data))
      .catch(() => setCatalogError("Cannot load catalog."))
      .finally(() => setCatalogLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // ✅ Delete product
  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(productId);
    try {
      const res = await apiFetch(`/products/${productId}`, { method: "DELETE" }); // DELETE /api/products/:id
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.ProductId !== productId));
    } catch {
      alert("Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle assign task
  const handleAssigned = (orderId: string, artistName: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, assignedTo: artistName, status: "IN_PRODUCTION" } : o
      )
    );
    setAssignModal(null);
  };

  // Chart data
  const revenueData = [
    { month: "Jan", revenue: 12000 }, { month: "Feb", revenue: 15000 },
    { month: "Mar", revenue: 18000 }, { month: "Apr", revenue: 22000 },
    { month: "May", revenue: 19000 }, { month: "Jun", revenue: 25000 },
  ];
  const orderStatusData = [
    { name: "Completed", value: orders.filter((o) => o.status === "COMPLETED").length, color: "#10b981" },
    { name: "In Progress", value: orders.filter((o) => o.status === "IN_PRODUCTION").length, color: "#3b82f6" },
    { name: "New", value: orders.filter((o) => o.status === "NEW").length, color: "#f59e0b" },
    { name: "Review", value: orders.filter((o) => o.status === "REVIEW").length, color: "#a855f7" },
  ];
  const categoryData = Object.entries(
    products.reduce((acc, p) => {
      const cat = p.Category ?? "Other";
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, count]) => ({ category, count }));

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Manager Dashboard</h1>
            <p className="text-gray-400">Monitor performance, manage catalog, and assign tasks</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Total Revenue</CardTitle>
                <DollarSign className="w-5 h-5 text-cyan-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">$45,000</div>
              <p className="text-xs text-green-400 mt-1">+20% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Active Orders</CardTitle>
                <Package className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {orders.filter((o) => o.status !== "COMPLETED").length}
              </div>
              <p className="text-xs text-green-400 mt-1">
                {orders.filter((o) => o.status === "NEW").length} unassigned
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Artists</CardTitle>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{MOCK_ARTISTS.length}</div>
              <p className="text-xs text-purple-400 mt-1">Available team members</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-300">Catalog Items</CardTitle>
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{products.length}</div>
              <p className="text-xs text-yellow-400 mt-1">Active products</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              Orders
              {orders.filter((o) => o.status === "NEW").length > 0 && (
                <span className="ml-2 bg-yellow-500 text-black text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {orders.filter((o) => o.status === "NEW").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="catalog">
              <Settings className="w-4 h-4 mr-2" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="w-4 h-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* ===================== TAB: OVERVIEW ===================== */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Trend</CardTitle>
                  <CardDescription className="text-gray-400">Monthly revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                      <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Order Status</CardTitle>
                  <CardDescription className="text-gray-400">Current breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={orderStatusData} cx="50%" cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80} dataKey="value"
                      >
                        {orderStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #3b82f6" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {categoryData.length > 0 && (
              <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Catalog by Category</CardTitle>
                  <CardDescription className="text-gray-400">Products per category (from live data)</CardDescription>
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

            <Card className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Export Reports</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-blue-500/50 text-slate-300">
                  <Download className="w-4 h-4 mr-2" /> Revenue Report (PDF)
                </Button>
                <Button variant="outline" className="border-blue-500/50 text-slate-300">
                  <Download className="w-4 h-4 mr-2" /> Team Performance (CSV)
                </Button>
                <Button variant="outline" className="border-blue-500/50 text-slate-300">
                  <Download className="w-4 h-4 mr-2" /> Order Summary (Excel)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== TAB: ORDERS (Global Order List + Detail + Assign) ===================== */}
          <TabsContent value="orders">
            {selectedOrder ? (
              // ---- ORDER DETAIL VIEW ----
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setSelectedOrderId(null)}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300"
                  >
                    ← Back to Orders
                  </Button>
                  <h2 className="text-white font-bold text-lg">Order Detail</h2>
                </div>

                <Card className="bg-slate-800/50 border-blue-500/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-xl mb-2">{selectedOrder.title}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={STATUS_CONFIG[selectedOrder.status]?.color ?? "bg-gray-600"}>
                            {STATUS_CONFIG[selectedOrder.status]?.label}
                          </Badge>
                          <span className="text-slate-400 text-sm">• {selectedOrder.id}</span>
                          <span className="text-slate-400 text-sm">• {selectedOrder.company}</span>
                        </div>
                      </div>
                      {/* Assign Task button — chỉ hiện khi chưa assign hoặc status là NEW */}
                      {(selectedOrder.status === "NEW" || !selectedOrder.assignedTo) && (
                        <Button
                          onClick={() => setAssignModal(selectedOrder)}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Assign Task
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                        <p className="text-slate-400 mb-1">Created</p>
                        <p className="text-white">{selectedOrder.createdAt}</p>
                      </div>
                      <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                        <p className="text-slate-400 mb-1">Assigned Artist</p>
                        <p className="text-white">{selectedOrder.assignedTo ?? "Not assigned"}</p>
                      </div>
                    </div>

                    {/* Production stages — mock, thay bằng API /api/orders/:id/stages khi có */}
                    <div>
                      <p className="text-white font-medium mb-3">Production Stages</p>
                      <div className="space-y-2">
                        {["PHOTOSHOOT", "MODELING", "SCENE_DESIGN", "POST_PROCESS"].map((stage, i) => {
                          const done = selectedOrder.status === "COMPLETED" ||
                            (selectedOrder.status === "IN_PRODUCTION" && i === 1) ||
                            (selectedOrder.status === "REVIEW" && i <= 2);
                          return (
                            <div key={stage} className="flex items-center gap-3 text-sm">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${done ? "bg-green-400" : "bg-slate-600"}`} />
                              <span className={done ? "text-white" : "text-slate-500"}>{stage.replace("_", " ")}</span>
                              {done && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // ---- GLOBAL ORDER LIST ----
              <Card className="bg-slate-800/50 border-blue-500/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">Global Order List</CardTitle>
                      <CardDescription className="text-gray-400">
                        Review incoming briefs and assign to artists
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-yellow-600/80">
                        {orders.filter((o) => o.status === "NEW").length} unassigned
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-white font-medium">{order.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-slate-400 text-xs">{order.id}</span>
                            <span className="text-slate-500 text-xs">•</span>
                            <span className="text-slate-400 text-xs">{order.company}</span>
                            {order.assignedTo && (
                              <>
                                <span className="text-slate-500 text-xs">•</span>
                                <span className="text-cyan-400 text-xs">→ {order.assignedTo}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_CONFIG[order.status]?.color ?? "bg-gray-600"}>
                          {STATUS_CONFIG[order.status]?.label}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-500/50 text-slate-300"
                          onClick={() => setSelectedOrderId(order.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {(order.status === "NEW" || !order.assignedTo) && (
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-cyan-600"
                            onClick={() => setAssignModal(order)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ===================== TAB: CATALOG MANAGEMENT ===================== */}
          <TabsContent value="catalog">
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Catalog Management</CardTitle>
                    <CardDescription className="text-gray-400">
                      Add, edit, and delete 3D/AR products
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={fetchCatalog}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300"
                      disabled={catalogLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${catalogLoading ? "animate-spin" : ""}`} />
                    </Button>
                    <Button
                      onClick={() => setProductModal({ open: true, product: null })}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
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
                    <Button onClick={fetchCatalog} variant="outline" className="border-slate-600 text-slate-300">
                      Retry
                    </Button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No products yet.</p>
                    <Button
                      onClick={() => setProductModal({ open: true, product: null })}
                      className="mt-4 bg-gradient-to-r from-blue-600 to-cyan-600"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.ProductId}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-medium truncate">{product.ProductName}</p>
                            {product.Category && (
                              <Badge className="bg-blue-600/80 text-xs flex-shrink-0">{product.Category}</Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm truncate">
                            {product.Description ?? "No description"}
                          </p>
                          <div className="flex gap-3 mt-1">
                            {product.SizeInfo && (
                              <span className="text-xs text-slate-500">Size: {product.SizeInfo}</span>
                            )}
                            {product.ColorInfo && (
                              <span className="text-xs text-slate-500">Color: {product.ColorInfo}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {/* Edit */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/50 text-slate-300"
                            onClick={() => setProductModal({ open: true, product })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteProduct(product.ProductId)}
                            disabled={deletingId === product.ProductId}
                          >
                            {deletingId === product.ProductId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===================== TAB: TEAM ===================== */}
          <TabsContent value="team">
            <Card className="bg-slate-800/50 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white">Team Performance</CardTitle>
                <CardDescription className="text-gray-400">Artist workload and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {MOCK_ARTISTS.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                        {artist.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{artist.name}</p>
                        <p className="text-slate-400 text-sm">{artist.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-bold">{artist.activeOrders}</p>
                        <p className="text-slate-400 text-xs">active orders</p>
                      </div>
                      <Badge className={artist.activeOrders <= 2 ? "bg-green-600" : "bg-yellow-600"}>
                        {artist.activeOrders <= 2 ? "Available" : "Busy"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ===================== MODAL: Add/Edit Product ===================== */}
      {productModal.open && (
        <ProductModal
          product={productModal.product}
          onClose={() => setProductModal({ open: false, product: null })}
          onSave={() => {
            setProductModal({ open: false, product: null });
            fetchCatalog(); // refresh list
          }}
        />
      )}

      {/* ===================== MODAL: Assign Task ===================== */}
      {assignModal && (
        <AssignTaskModal
          order={assignModal}
          onClose={() => setAssignModal(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}