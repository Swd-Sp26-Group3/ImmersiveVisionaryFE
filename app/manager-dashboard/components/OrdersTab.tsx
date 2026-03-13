"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Eye, UserCheck, Loader2, AlertCircle, CheckCircle2,
  RefreshCw, X, ArrowLeft, Package
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Artist, CreativeOrder, CreativeOrderStatus, STATUS_CONFIG } from "./type";

// ===================== AssignTaskModal =====================
function AssignTaskModal({
  order,
  artists,
  onClose,
  onAssigned,
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
    setAssigning(true);
    setError("");
    try {
      // Gọi PUT /orders/:id/status → IN_PRODUCTION
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: "IN_PRODUCTION" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to assign");
      }
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
          {/* Order summary */}
          <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Order</p>
            <p className="text-white font-medium">{order.ProductName ?? `Order #${order.OrderId}`}</p>
            <p className="text-slate-400 text-sm">#{order.OrderId} • {order.CompanyName}</p>
            {order.Brief && (
              <p className="text-slate-500 text-xs mt-1 line-clamp-2">{order.Brief}</p>
            )}
          </div>

          {/* Artist selection */}
          <div className="space-y-3">
            <Label className="text-white">Select Artist *</Label>
            {artists.length === 0 ? (
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                No artists available.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {artists.map((artist) => (
                  <button
                    key={artist.UserId}
                    onClick={() => setSelectedArtist(artist.UserId)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                      selectedArtist === artist.UserId
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

          {/* Note */}
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
          <Button onClick={onClose} variant="outline" className="flex-1 border-slate-600 text-slate-300">
            Cancel
          </Button>
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

// ===================== OrderDetail =====================
function OrderDetail({
  order: initialOrder,
  artists,
  onBack,
  onOrderUpdated,
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
    setUpdatingStatus(true);
    setStatusError("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Update failed");
      }
      const data = await res.json();
      const updated = data.data ?? data;
      setOrder(updated);
      onOrderUpdated(updated);
    } catch (err: any) {
      setStatusError(err.message ?? "Status update failed.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const STAGES: { key: string; label: string; statuses: CreativeOrderStatus[] }[] = [
    { key: "NEW",           label: "Order Received",    statuses: ["NEW", "IN_PRODUCTION", "REVIEW", "COMPLETED", "DELIVERED"] },
    { key: "IN_PRODUCTION", label: "3D Production",     statuses: ["IN_PRODUCTION", "REVIEW", "COMPLETED", "DELIVERED"] },
    { key: "REVIEW",        label: "Client Review",     statuses: ["REVIEW", "COMPLETED", "DELIVERED"] },
    { key: "COMPLETED",     label: "Completed",         statuses: ["COMPLETED", "DELIVERED"] },
    { key: "DELIVERED",     label: "Delivered",         statuses: ["DELIVERED"] },
  ];

  const NEXT_STATUS_MAP: Partial<Record<CreativeOrderStatus, CreativeOrderStatus>> = {
    NEW:          "IN_PRODUCTION",
    IN_PRODUCTION:"REVIEW",
    REVIEW:       "COMPLETED",
    COMPLETED:    "DELIVERED",
  };

  const nextStatus = NEXT_STATUS_MAP[order.Status];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Button>
        <h2 className="text-white font-bold text-lg">Order Detail</h2>
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
                <Button
                  onClick={() => setAssignModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600"
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Assign to Artist
                </Button>
              )}
              {nextStatus && order.Status !== "NEW" && (
                <Button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={updatingStatus}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500"
                >
                  {updatingStatus
                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    : <CheckCircle2 className="w-4 h-4 mr-2" />
                  }
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

          {/* Order info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: "Order ID",       value: `#${order.OrderId}` },
              { label: "Company",        value: order.CompanyName ?? `#${order.CompanyId}` },
              { label: "Product",        value: order.ProductName ?? `#${order.ProductId}` },
              { label: "Package",        value: order.PackageName ?? `#${order.PackageId}` },
              { label: "Platform",       value: order.TargetPlatform ?? "Not specified" },
              { label: "Deadline",       value: order.Deadline ? new Date(order.Deadline).toLocaleDateString() : "No deadline" },
              { label: "Created",        value: new Date(order.CreatedAt).toLocaleDateString() },
              { label: "Last updated",   value: order.UpdatedAt ? new Date(order.UpdatedAt).toLocaleDateString() : "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-400 text-xs mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Brief */}
          {order.Brief && (
            <div className="bg-slate-900/60 rounded-lg p-4 border border-slate-700">
              <p className="text-slate-400 text-xs mb-2">Brief</p>
              <p className="text-white text-sm leading-relaxed">{order.Brief}</p>
            </div>
          )}

          {/* Production stages */}
          <div>
            <p className="text-white font-medium mb-4">Production Stages</p>
            <div className="space-y-3">
              {STAGES.map(({ key, label, statuses }) => {
                const done = statuses.includes(order.Status);
                const current = order.Status === key;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      done ? "bg-green-400" : current ? "bg-blue-400 animate-pulse" : "bg-slate-600"
                    }`} />
                    <span className={`text-sm ${done ? "text-white" : "text-slate-500"}`}>{label}</span>
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                    {current && !done && <span className="text-xs text-blue-400">(current)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign modal */}
      {assignModal && (
        <AssignTaskModal
          order={order}
          artists={artists}
          onClose={() => setAssignModal(false)}
          onAssigned={(updated) => {
            setOrder(updated);
            onOrderUpdated(updated);
            setAssignModal(false);
          }}
        />
      )}
    </div>
  );
}

// ===================== OrdersTab =====================
export function OrdersTab({ artists }: { artists: Artist[] }) {
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<CreativeOrder | null>(null);
  const [assignModal, setAssignModal] = useState<CreativeOrder | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    setError("");
    apiFetch("/orders")                          // GET /api/orders — manager sees all
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data) => setOrders(data.data ?? data))
      .catch(() => setError("Cannot load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOrderUpdated = (updated: CreativeOrder) => {
    setOrders((prev) => prev.map((o) => o.OrderId === updated.OrderId ? updated : o));
    if (selectedOrder?.OrderId === updated.OrderId) setSelectedOrder(updated);
  };

  // ---- Detail view ----
  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        artists={artists}
        onBack={() => setSelectedOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    );
  }

  const newCount = orders.filter((o) => o.Status === "NEW").length;

  return (
    <>
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Global Order List</CardTitle>
              <CardDescription className="text-gray-400">
                Review incoming briefs and assign to artists
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {newCount > 0 && (
                <Badge className="bg-yellow-600/80">{newCount} unassigned</Badge>
              )}
              <Button
                onClick={fetchOrders}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
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
              <Button onClick={fetchOrders} variant="outline" className="border-slate-600 text-slate-300">
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.OrderId}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {order.ProductName ?? `Order #${order.OrderId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-slate-400 text-xs">#{order.OrderId}</span>
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-400 text-xs">
                        {order.CompanyName ?? `Company #${order.CompanyId}`}
                      </span>
                      {order.PackageName && (
                        <>
                          <span className="text-slate-500 text-xs">•</span>
                          <span className="text-slate-400 text-xs">{order.PackageName}</span>
                        </>
                      )}
                      <span className="text-slate-500 text-xs">•</span>
                      <span className="text-slate-400 text-xs">
                        {new Date(order.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <Badge className={STATUS_CONFIG[order.Status]?.color ?? "bg-gray-600"}>
                      {STATUS_CONFIG[order.Status]?.label}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/50 text-slate-300"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                    {order.Status === "NEW" && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600"
                        onClick={() => setAssignModal(order)}
                      >
                        <UserCheck className="w-4 h-4 mr-1" /> Assign
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick assign modal from list */}
      {assignModal && (
        <AssignTaskModal
          order={assignModal}
          artists={artists}
          onClose={() => setAssignModal(null)}
          onAssigned={(updated) => {
            handleOrderUpdated(updated);
            setAssignModal(null);
          }}
        />
      )}
    </>
  );
}