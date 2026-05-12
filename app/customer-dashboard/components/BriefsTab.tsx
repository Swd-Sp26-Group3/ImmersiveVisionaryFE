"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { StatusBadge } from "@/app/components/ui/status-badge";
import { Modal } from "@/app/components/ui/modal";
import { useConfirm } from "@/app/components/ui/confirm-dialog";
import { Progress } from "@/app/components/ui/progress";
import {
  FileText, Plus, XCircle, Clock, CheckCircle2, Package,
  Eye, Loader2, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { ApiOrder, ORDER_STATUS_CONFIG, getOrderProgress } from "./types";
import type { Attachment } from "@/lib/types";
import OBJModelViewer from "../../components/3d/OBJModelViewer";
import { toast } from "sonner";

export function BriefsTab() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState<Attachment | null>(null);
  const [previewingOrderId, setPreviewingOrderId] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handlePreview3D = async (orderId: number) => {
    setLoadingPreview(true);
    setPreviewingOrderId(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/attachments`);
      if (!res.ok) throw new Error("Could not load attachments");
      const data = await res.json();
      const attachments: Attachment[] = data.data ?? data;
      const objFile = attachments.find((a) => a.FileName.toLowerCase().endsWith(".obj"));
      if (objFile) {
        setShowPreview(objFile);
      } else {
        toast.warning("No 3D model found for this order yet.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load 3D preview.");
    } finally {
      setLoadingPreview(false);
      setPreviewingOrderId(null);
    }
  };

  const fetchOrders = () => {
    setLoading(true);
    setError("");
    apiFetch("/orders/my")
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          if (r.status === 400 && (text.includes("company") || text.includes("User is not associated"))) {
            return { data: [] };
          }
          throw new Error(text);
        }
        return r.json();
      })
      .then((d) => { const arr = d.data ?? d; setOrders(Array.isArray(arr) ? arr : []); })
      .catch((e) => {
        if (!e.message.includes("User is not associated")) {
          setError(`Cannot load briefs. (${e.message})`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId: number) => {
    const ok = await confirm({
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order?",
      confirmLabel: "Yes, Cancel",
      cancelLabel: "Keep It",
      variant: "danger",
    });
    if (!ok) return;
    setCancelling(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Cancel failed");
      setOrders((prev) =>
        prev.map((o) => (o.OrderId === orderId ? { ...o, Status: "CANCELLED" as const } : o))
      );
      toast.success("Order cancelled.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel.");
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
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/order">
            <Button
              className="text-sm text-white"
              style={{ background: "var(--gradient-accent)" }}
            >
              <Plus className="w-4 h-4 mr-1" /> New Brief
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner size="md" color="cyan" fullPage />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No custom orders yet"
          description="Submit a brief to get started with custom 3D/AR production"
          action={
            <Link href="/order">
              <Button className="text-white" style={{ background: "var(--gradient-accent)" }}>
                <Plus className="w-4 h-4 mr-2" /> Create First Brief
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg = ORDER_STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "text-slate-300", bg: "bg-slate-500/15" };
            const progress = getOrderProgress(order.Status);
            return (
              <div
                key={order.OrderId}
                className="rounded-xl bg-slate-800/50 border border-blue-500/20 p-4 hover:border-blue-500/40 transition"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/50 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      {order.Status === "COMPLETED" || order.Status === "DELIVERED" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : order.Status === "CANCELLED" ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {order.ProjectName || order.ProductName || `Order #${order.OrderId}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <StatusBadge status={order.Status} config={ORDER_STATUS_CONFIG} />
                        <span className="text-slate-500 text-xs">#{order.OrderId}</span>
                        {order.Budget && <span className="text-green-400 text-xs">{order.Budget}</span>}
                        {order.DeliverySpeed && <span className="text-yellow-400 text-xs">{order.DeliverySpeed}</span>}
                      </div>
                    </div>
                  </div>
                  {order.Status === "NEW" && (
                    <Button
                      size="sm"
                      variant="outline"
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

                <div className="mt-3 flex gap-2">
                  {(order.Status === "REVIEW" || order.Status === "COMPLETED" || order.Status === "DELIVERED") && (
                    <Button
                      size="sm"
                      className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs"
                      onClick={() => handlePreview3D(order.OrderId)}
                      disabled={loadingPreview && previewingOrderId === order.OrderId}
                    >
                      {loadingPreview && previewingOrderId === order.OrderId
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        : <Eye className="w-3 h-3 mr-1" />}
                      View 3D Preview
                    </Button>
                  )}
                </div>

                <p className="text-slate-600 text-[10px] mt-3">
                  Created {new Date(order.CreatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D Preview Modal */}
      <Modal
        open={!!showPreview}
        onClose={() => setShowPreview(null)}
        title={
          showPreview ? (
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" /> 3D Preview: {showPreview.FileName}
            </span>
          ) : undefined
        }
        maxWidth="2xl"
      >
        {showPreview && (
          <div className="p-6">
            <OBJModelViewer objData={showPreview.Base64Data} />
          </div>
        )}
      </Modal>

      {ConfirmDialogComponent}
    </div>
  );
}