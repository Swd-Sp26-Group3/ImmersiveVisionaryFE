"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  Loader2, AlertCircle, RefreshCw, XCircle,
  Clock, CheckCircle2, Package
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ApiOrder, ORDER_STATUS_CONFIG, getStatusColor, getStatusLabel, getOrderProgress } from "./types";

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "COMPLETED" || status === "DELIVERED") return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "IN_PRODUCTION" || status === "REVIEW") return <Clock className="w-4 h-4 text-blue-400" />;
  if (status === "CANCELLED") return <XCircle className="w-4 h-4 text-red-400" />;
  return <AlertCircle className="w-4 h-4 text-yellow-400" />;
};

export function OrdersTab() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchOrders = () => {
    setLoading(true); setError("");
    apiFetch("/orders/my")
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { const arr = d.data ?? d; setOrders(Array.isArray(arr) ? arr : []); })
      .catch(e => setError(`Cannot load orders. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, { method: "PUT" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Cancel failed");
      }
      setOrders(prev => prev.map(o =>
        o.OrderId === orderId ? { ...o, Status: "CANCELLED" } : o
      ));
    } catch (e: any) {
      alert(e.message ?? "Failed to cancel order.");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center py-16 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-red-400 text-sm">{error}</p>
        <Button onClick={fetchOrders} variant="outline" className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 font-medium mb-1">No orders yet</p>
        <p className="text-slate-600 text-sm mb-4">Place your first custom order to get started</p>
        <a href="/order">
          <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            Place New Order
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={fetchOrders} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {orders.map((order) => {
        const progress = getOrderProgress(order.Status);

        return (
          <Card key={order.OrderId} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-900/50 border border-white/6">
                    <StatusIcon status={order.Status} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-white mb-2 truncate">
                      {order.ProjectName || order.ProductName || `Order #${order.OrderId}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge className={getStatusColor(order.Status)}>{getStatusLabel(order.Status)}</Badge>
                      <span className="text-sm text-gray-400">• #{order.OrderId}</span>
                      {order.PackageName && (
                        <span className="text-sm text-gray-400">• {order.PackageName}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {order.Status !== "CANCELLED" && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>Progress:</span>
                          <div className="w-32">
                            <Progress value={progress} className="h-2" />
                          </div>
                          <span>{progress}%</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-sm text-gray-400">
                        <span>Created: {new Date(order.CreatedAt).toLocaleDateString()}</span>
                        {order.DeliverySpeed && (
                          <span className="text-yellow-400">
                            Speed: {order.DeliverySpeed}
                          </span>
                        )}
                        {order.Budget && (
                          <span className="text-green-400">
                            Budget: {order.Budget}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {order.Status === "NEW" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      onClick={() => handleCancel(order.OrderId)}
                      disabled={cancelling === order.OrderId}
                    >
                      {cancelling === order.OrderId
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><XCircle className="w-4 h-4 mr-1" /> Cancel</>
                      }
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {order.Brief && (
              <CardContent className="pt-0">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-3">
                  <p className="text-slate-500 text-xs mb-1">Brief</p>
                  <p className="text-slate-300 text-sm line-clamp-2">{order.Brief}</p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}