"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Eye, UserCheck, Loader2, AlertCircle, CheckCircle2,
  RefreshCw, X, ArrowLeft, Package, ShoppingBag,
  Building2, DollarSign, Clock, RotateCcw
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Artist, CreativeOrder, CreativeOrderStatus, STATUS_CONFIG } from "./type";

interface MarketplaceOrder {
  MpOrderId: number;
  AssetId: number;
  BuyerCompanyId: number;
  SellerCompanyId: number;
  Price: number | null;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  CreatedAt: string;
  AssetName?: string | null;
  BuyerCompanyName?: string | null;
  SellerCompanyName?: string | null;
}

const MP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-600" },
  PAID: { label: "Paid", color: "bg-green-600" },
  DELIVERED: { label: "Delivered", color: "bg-cyan-600" },
  REFUNDED: { label: "Refunded", color: "bg-red-600" },
};

// ===================== AssignTaskModal =====================
function AssignTaskModal({
  order, artists, onClose, onAssigned,
}: {
  order: CreativeOrder;
  artists: Artist[];
  onClose: () => void;
  onAssigned: (updatedOrder: CreativeOrder) => void;
}) {
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    if (!selectedArtist) return;
    setAssigning(true); setError("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: "IN_PRODUCTION", ArtistId: selectedArtist }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to assign");
      const data = await res.json();
      onAssigned(data.data ?? data);
    } catch (err: any) {
      setError(err.message ?? "Assignment failed.");
    } finally {
      setAssigning(false);
    }
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
          <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Order</p>
            <p className="text-white font-medium">{order.ProductName ?? `Order #${order.OrderId}`}</p>
            <p className="text-slate-400 text-sm">#{order.OrderId} · {order.CompanyName}</p>
            {order.Brief && <p className="text-slate-500 text-xs mt-1 line-clamp-2">{order.Brief}</p>}
          </div>

          <div className="space-y-3">
            <Label className="text-white">Select Artist *</Label>
            {artists.length === 0 ? (
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> No artists available.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {artists.map((artist) => (
                  <button
                    key={artist.UserId}
                    onClick={() => setSelectedArtist(artist.UserId)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${selectedArtist === artist.UserId
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-slate-700 hover:border-slate-500"
                      }`}
                  >
                    <div>
                      <p className="text-white font-medium">{artist.UserName}</p>
                      <p className="text-slate-400 text-xs">{artist.Email ?? "No email"}</p>
                    </div>
                    <Badge className={artist.IsActive ? "bg-green-700 text-xs" : "bg-slate-600 text-xs"}>
                      {artist.IsActive ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white">Instructions / Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Special instructions for the artist..."
              rows={3}
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700">
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-600 text-slate-300">Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedArtist || assigning}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {assigning
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Assigning...</>
              : <><UserCheck className="w-4 h-4 mr-2" />Assign & Start Production</>
            }
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===================== Creative Order Detail =====================
function CreativeOrderDetail({
  order: initialOrder, artists, onBack, onOrderUpdated,
}: {
  order: CreativeOrder;
  artists: Artist[];
  onBack: () => void;
  onOrderUpdated: (updated: CreativeOrder) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [assignModal, setAssignModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const handleStatusChange = async (newStatus: CreativeOrderStatus) => {
    setUpdatingStatus(true); setStatusError("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Update failed");
      const updated = (await res.json()).data;
      setOrder(updated); onOrderUpdated(updated);
    } catch (err: any) {
      setStatusError(err.message ?? "Status update failed.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const STAGES = [
    { key: "NEW", label: "Order Received" },
    { key: "IN_PRODUCTION", label: "3D Production" },
    { key: "REVIEW", label: "Client Review" },
    { key: "COMPLETED", label: "Completed" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const NEXT_STATUS_MAP: Partial<Record<CreativeOrderStatus, CreativeOrderStatus>> = {
    NEW: "IN_PRODUCTION", IN_PRODUCTION: "REVIEW", REVIEW: "COMPLETED", COMPLETED: "DELIVERED",
  };
  const nextStatus = NEXT_STATUS_MAP[order.Status];
  const stageIdx = STAGES.findIndex(s => s.key === order.Status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h2 className="text-white font-bold text-lg">Creative Order Detail</h2>
      </div>

      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-white text-xl mb-2">
                {order.ProductName ?? `Order #${order.OrderId}`}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={STATUS_CONFIG[order.Status]?.color ?? "bg-gray-600"}>
                  {STATUS_CONFIG[order.Status]?.label}
                </Badge>
                <span className="text-slate-400 text-sm">• #{order.OrderId}</span>
                <span className="text-slate-400 text-sm">• {order.CompanyName ?? `Company #${order.CompanyId}`}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {order.Status === "NEW" && (
                <Button onClick={() => setAssignModal(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                  <UserCheck className="w-4 h-4 mr-2" /> Assign to Artist
                </Button>
              )}
              {nextStatus && order.Status !== "NEW" && (
                <Button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={updatingStatus}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Move to {STATUS_CONFIG[nextStatus]?.label}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {statusError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" /> {statusError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Order ID", value: `#${order.OrderId}` },
              { label: "Company", value: order.CompanyName ?? `#${order.CompanyId}` },
              { label: "Product", value: order.ProductName ?? `#${order.ProductId}` },
              { label: "Package", value: order.PackageName ?? `#${order.PackageId}` },
              { label: "Platform", value: order.TargetPlatform ?? "Not specified" },
              { label: "Deadline", value: order.Deadline ? new Date(order.Deadline).toLocaleDateString() : "No deadline" },
              { label: "Created", value: new Date(order.CreatedAt).toLocaleDateString() },
              { label: "Last updated", value: order.UpdatedAt ? new Date(order.UpdatedAt).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {order.Brief && (
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-xs mb-2">Brief</p>
              <p className="text-white text-sm leading-relaxed">{order.Brief}</p>
            </div>
          )}

          {/* Production stages */}
          <div>
            <p className="text-white font-medium mb-4">Production Stages</p>
            <div className="relative">
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-white/10" />
              <div className="space-y-3">
                {STAGES.map((s, i) => {
                  const done = i < stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div key={s.key} className="flex items-center gap-3 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${done ? "bg-green-500" : current ? "bg-white ring-2 ring-cyan-500/40" : "bg-white/10"
                        }`}>
                        {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {current && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                      <span className={`text-sm ${current ? "text-white font-semibold" : done ? "text-slate-300" : "text-slate-600"}`}>
                        {s.label}
                      </span>
                      {current && (
                        <span className="ml-auto text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {assignModal && (
        <AssignTaskModal
          order={order} artists={artists}
          onClose={() => setAssignModal(false)}
          onAssigned={(updated) => { setOrder(updated); onOrderUpdated(updated); setAssignModal(false); }}
        />
      )}
    </div>
  );
}

// ===================== Marketplace Order Detail =====================
function MarketplaceOrderDetail({
  order: initialOrder, onBack, onOrderUpdated,
}: {
  order: MarketplaceOrder;
  onBack: () => void;
  onOrderUpdated: (updated: MarketplaceOrder) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const handleDeliver = async () => {
    // Manager đánh dấu delivered — cần BE endpoint, hiện tại dùng refund endpoint làm ví dụ
    // Nếu BE có PUT /marketplace-orders/:id/status thì dùng đó
    // Hiện tại chỉ hiển thị thông tin, không có action deliver riêng
    setError("Deliver action requires additional BE endpoint (PUT /marketplace-orders/:id/status).");
  };

  const handleRefund = async () => {
    if (!confirm(`Refund marketplace order #${order.MpOrderId}?`)) return;
    setUpdating(true); setError("");
    try {
      const res = await apiFetch(`/marketplace-orders/${order.MpOrderId}/refund`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Refund failed");
      const updated = (await res.json()).data ?? order;
      setOrder({ ...order, Status: "REFUNDED" });
      onOrderUpdated({ ...order, Status: "REFUNDED" });
    } catch (err: any) {
      setError(err.message ?? "Refund failed.");
    } finally {
      setUpdating(false);
    }
  };

  const cfg = MP_STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "bg-slate-600" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h2 className="text-white font-bold text-lg">Marketplace Order Detail</h2>
      </div>

      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <CardTitle className="text-white text-xl">
                  {order.AssetName ?? `Asset #${order.AssetId}`}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cfg.color}>{cfg.label}</Badge>
                <span className="text-slate-400 text-sm">• Order #{order.MpOrderId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {(order.Status === "PAID" || order.Status === "DELIVERED") && (
                <Button
                  onClick={handleRefund}
                  disabled={updating}
                  variant="outline"
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Refund
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Order ID", value: `#${order.MpOrderId}` },
              { label: "Asset ID", value: `#${order.AssetId}` },
              { label: "Buyer", value: order.BuyerCompanyName ?? `Company #${order.BuyerCompanyId}` },
              { label: "Seller", value: order.SellerCompanyName ?? `Company #${order.SellerCompanyId}` },
              { label: "Price", value: order.Price != null ? `${order.Price.toLocaleString("vi-VN")} ₫` : "—" },
              { label: "Created", value: new Date(order.CreatedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* MP Order status steps */}
          <div>
            <p className="text-white font-medium mb-4">Order Progress</p>
            <div className="relative">
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-white/10" />
              {[
                { key: "PENDING", label: "Order Placed" },
                { key: "PAID", label: "Payment Confirmed" },
                { key: "DELIVERED", label: "Asset Delivered" },
              ].map((s, i) => {
                const statusOrder = ["PENDING", "PAID", "DELIVERED", "REFUNDED"];
                const curIdx = statusOrder.indexOf(order.Status);
                const sIdx = statusOrder.indexOf(s.key);
                const done = curIdx > sIdx && order.Status !== "REFUNDED";
                const current = order.Status === s.key;
                return (
                  <div key={s.key} className="flex items-center gap-3 relative z-10 mb-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-green-500" : current ? "bg-white ring-2 ring-purple-400/40" : "bg-white/10"
                      }`}>
                      {done && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {current && <div className="w-2 h-2 rounded-full bg-black" />}
                    </div>
                    <span className={`text-sm ${current ? "text-white font-semibold" : done ? "text-slate-300" : "text-slate-600"}`}>
                      {s.label}
                    </span>
                    {current && (
                      <span className="ml-auto text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
              {order.Status === "REFUNDED" && (
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-red-400 text-sm font-semibold">Refunded</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== Creative Orders Sub-tab =====================
function CreativeOrdersSubTab({ artists }: { artists: Artist[] }) {
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CreativeOrder | null>(null);
  const [assignModal, setAssignModal] = useState<CreativeOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchOrders = () => {
    setLoading(true); setError("");
    apiFetch("/orders")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setOrders(d.data ?? d))
      .catch(() => setError("Cannot load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOrderUpdated = (updated: CreativeOrder) => {
    setOrders((prev) => prev.map((o) => o.OrderId === updated.OrderId ? updated : o));
    if (selected?.OrderId === updated.OrderId) setSelected(updated);
  };

  if (selected) {
    return (
      <CreativeOrderDetail
        order={selected} artists={artists}
        onBack={() => setSelected(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    );
  }

  const filtered = filterStatus === "ALL" ? orders : orders.filter(o => o.Status === filterStatus);
  const newCount = orders.filter(o => o.Status === "NEW").length;

  return (
    <Card className="bg-slate-800/50 border-blue-500/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Creative Orders
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Review briefs, assign artists, track production
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && <Badge className="bg-yellow-600/80">{newCount} unassigned</Badge>}
            <Button onClick={fetchOrders} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["ALL", "NEW", "IN_PRODUCTION", "REVIEW", "COMPLETED", "DELIVERED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${filterStatus === s
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-600 text-slate-400 hover:border-slate-400"
                }`}
            >
              {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label ?? s}
              {s !== "ALL" && (
                <span className="ml-1 opacity-60">({orders.filter(o => o.Status === s).length})</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-400">{error}</p>
            <Button onClick={fetchOrders} variant="outline" className="border-slate-600 text-slate-300">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No orders found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div
                key={order.OrderId}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {order.ProductName ?? `Order #${order.OrderId}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
                    <span>#{order.OrderId}</span>
                    <span>·</span>
                    <span>{order.CompanyName ?? `Company #${order.CompanyId}`}</span>
                    {order.PackageName && <><span>·</span><span>{order.PackageName}</span></>}
                    <span>·</span>
                    <span>{new Date(order.CreatedAt).toLocaleDateString()}</span>
                    {order.Deadline && (
                      <><span>·</span><span className="text-yellow-400">Due {new Date(order.Deadline).toLocaleDateString()}</span></>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge className={`text-xs ${STATUS_CONFIG[order.Status]?.color ?? "bg-gray-600"}`}>
                    {STATUS_CONFIG[order.Status]?.label}
                  </Badge>
                  <Button size="sm" variant="outline" className="border-blue-500/50 text-slate-300"
                    onClick={() => setSelected(order)}>
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  {order.Status === "NEW" && (
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600"
                      onClick={() => setAssignModal(order)}>
                      <UserCheck className="w-4 h-4 mr-1" /> Assign
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {assignModal && (
        <AssignTaskModal
          order={assignModal} artists={artists}
          onClose={() => setAssignModal(null)}
          onAssigned={(updated) => { handleOrderUpdated(updated); setAssignModal(null); }}
        />
      )}
    </Card>
  );
}

// ===================== Marketplace Orders Sub-tab =====================
function MarketplaceOrdersSubTab() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MarketplaceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchOrders = () => {
    setLoading(true); setError("");
    // GET /api/marketplace-orders — manager thấy tất cả
    apiFetch("/marketplace-orders")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setOrders(d.data ?? d))
      .catch((e) => setError(`Cannot load marketplace orders. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOrderUpdated = (updated: MarketplaceOrder) => {
    setOrders((prev) => prev.map((o) => o.MpOrderId === updated.MpOrderId ? updated : o));
    if (selected?.MpOrderId === updated.MpOrderId) setSelected(updated);
  };

  if (selected) {
    return (
      <MarketplaceOrderDetail
        order={selected}
        onBack={() => setSelected(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    );
  }

  const filtered = filterStatus === "ALL" ? orders : orders.filter(o => o.Status === filterStatus);
  const pendingCount = orders.filter(o => o.Status === "PENDING").length;
  const totalRevenue = orders.filter(o => o.Status === "PAID" || o.Status === "DELIVERED")
    .reduce((s, o) => s + (o.Price ?? 0), 0);

  return (
    <Card className="bg-slate-800/50 border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400" />
              Marketplace Orders
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Asset purchases — manage delivery and refunds
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <Badge className="bg-yellow-600/80">{pendingCount} pending</Badge>}
            <Button onClick={fetchOrders} variant="outline" size="sm" className="border-slate-600 text-slate-300" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats row */}
        {orders.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-3">
            {[
              { label: "Total Orders", value: orders.length, color: "text-white" },
              { label: "Pending", value: orders.filter(o => o.Status === "PENDING").length, color: "text-yellow-400" },
              { label: "Delivered", value: orders.filter(o => o.Status === "DELIVERED").length, color: "text-cyan-400" },
              { label: "Revenue", value: `${totalRevenue.toLocaleString("vi-VN")} ₫`, color: "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900/60 rounded-xl p-3 border border-white/8 text-center">
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className={`font-bold text-sm ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex flex-wrap gap-2 mt-3">
          {["ALL", "PENDING", "PAID", "DELIVERED", "REFUNDED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${filterStatus === s
                ? "bg-purple-600 border-purple-600 text-white"
                : "border-slate-600 text-slate-400 hover:border-slate-400"
                }`}
            >
              {s === "ALL" ? "All" : MP_STATUS_CONFIG[s]?.label ?? s}
              {s !== "ALL" && (
                <span className="ml-1 opacity-60">({orders.filter(o => o.Status === s).length})</span>
              )}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
            <Button onClick={fetchOrders} variant="outline" className="border-slate-600 text-slate-300">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No marketplace orders found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const cfg = MP_STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "bg-slate-600" };
              return (
                <div
                  key={order.MpOrderId}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-purple-500/10 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <p className="text-white font-medium truncate">
                        {order.AssetName ?? `Asset #${order.AssetId}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
                      <span>Order #{order.MpOrderId}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {order.BuyerCompanyName ?? `Buyer #${order.BuyerCompanyId}`}
                      </span>
                      {order.Price != null && (
                        <><span>·</span>
                          <span className="flex items-center gap-1 text-green-400">
                            <DollarSign className="w-3 h-3" />{order.Price.toLocaleString("vi-VN")} ₫
                          </span></>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{new Date(order.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                    <Button size="sm" variant="outline" className="border-purple-500/50 text-slate-300"
                      onClick={() => setSelected(order)}>
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== Main OrdersTab =====================
export function OrdersTab({ artists }: { artists: Artist[] }) {
  const [subTab, setSubTab] = useState<"creative" | "marketplace">("creative");

  return (
    <div className="space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 p-1 bg-slate-800/60 border border-white/8 rounded-xl w-fit">
        <button
          onClick={() => setSubTab("creative")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${subTab === "creative"
            ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white"
            }`}
        >
          <Package className="w-4 h-4" />
          Creative Orders
        </button>
        <button
          onClick={() => setSubTab("marketplace")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${subTab === "marketplace"
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
            : "text-slate-400 hover:text-white"
            }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Marketplace Orders
        </button>
      </div>

      {subTab === "creative"
        ? <CreativeOrdersSubTab artists={artists} />
        : <MarketplaceOrdersSubTab />
      }
    </div>
  );
}