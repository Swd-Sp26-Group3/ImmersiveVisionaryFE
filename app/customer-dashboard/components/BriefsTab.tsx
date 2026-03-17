"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import {
  FileText, Plus, Loader2, AlertCircle, RefreshCw,
  XCircle, Clock, CheckCircle2, Package,
} from "lucide-react";
import Link from "next/link";
import { ApiOrder, ORDER_STATUS_CONFIG, getOrderProgress } from "./types";

export function BriefsTab() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchOrders = () => {
    setLoading(true); setError("");
    apiFetch("/orders/my")
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { const arr = d.data ?? d; setOrders(Array.isArray(arr) ? arr : []); })
      .catch(e => setError(`Cannot load briefs. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId: number) => {
    if (!confirm("Cancel this order?")) return;
    setCancelling(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Cancel failed");
      setOrders(prev => prev.map(o => o.OrderId === orderId ? { ...o, Status: "CANCELLED" as const } : o));
    } catch (e: any) {
      alert(e.message ?? "Failed to cancel.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" /> My Briefs / Custom Orders
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Track your custom 3D/AR production requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/order">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-sm">
              <Plus className="w-4 h-4 mr-1" /> New Brief
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
          <Button onClick={fetchOrders} variant="outline" className="border-slate-600 text-slate-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium mb-1">No custom orders yet</p>
          <p className="text-slate-600 text-sm mb-5">Submit a brief to get started with custom 3D/AR production</p>
          <Link href="/order">
            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600">
              <Plus className="w-4 h-4 mr-2" /> Create First Brief
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const cfg = ORDER_STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "text-slate-300", bg: "bg-slate-600" };
            const progress = getOrderProgress(order.Status);
            return (
              <div key={order.OrderId}
                className="rounded-xl bg-slate-800/50 border border-blue-500/20 p-4 hover:border-blue-500/40 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-white/6 flex items-center justify-center flex-shrink-0">
                      {order.Status === "COMPLETED" || order.Status === "DELIVERED"
                        ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                        : order.Status === "CANCELLED"
                          ? <XCircle className="w-4 h-4 text-red-400" />
                          : <Clock className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {order.ProjectName || order.ProductName || `Order #${order.OrderId}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge className={`${cfg.bg} text-xs`}>{cfg.label}</Badge>
                        <span className="text-slate-500 text-xs">#{order.OrderId}</span>
                        {order.Budget && <span className="text-green-400 text-xs">{order.Budget}</span>}
                        {order.DeliverySpeed && <span className="text-yellow-400 text-xs">{order.DeliverySpeed}</span>}
                      </div>
                    </div>
                  </div>
                  {order.Status === "NEW" && (
                    <Button size="sm" variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-shrink-0"
                      onClick={() => handleCancel(order.OrderId)}
                      disabled={cancelling === order.OrderId}
                    >
                      {cancelling === order.OrderId
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <><XCircle className="w-4 h-4 mr-1" />Cancel</>}
                    </Button>
                  )}
                </div>

                {order.Status !== "CANCELLED" && (
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="flex-shrink-0">{progress}%</span>
                  </div>
                )}

                {order.Brief && (
                  <p className="text-slate-500 text-xs line-clamp-2 mt-1">{order.Brief}</p>
                )}

                <p className="text-slate-600 text-xs mt-2">
                  Created {new Date(order.CreatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}