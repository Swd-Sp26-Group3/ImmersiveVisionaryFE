"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Progress } from "@/app/components/ui/progress";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { StatusBadge } from "@/app/components/ui/status-badge";
import { Modal } from "@/app/components/ui/modal";
import { useConfirm } from "@/app/components/ui/confirm-dialog";
import {
  RefreshCw, XCircle, Clock, CheckCircle2, Package,
  Eye, Send, Check, Archive, ShoppingBag, Download, Loader2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ApiOrder, ORDER_STATUS_CONFIG, getOrderProgress } from "./types";
import type { Attachment } from "@/lib/types";
import OBJModelViewer from "@/app/components/3d/OBJModelViewer";
import { toast } from "sonner";

// ── Status icon helper ────────────────────────────────────────────────────────
const StatusIcon = ({ status }: { status: string }) => {
  if (status === "COMPLETED" || status === "DELIVERED")
    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "IN_PRODUCTION" || status === "REVIEW")
    return <Clock className="w-4 h-4 text-blue-400" />;
  if (status === "CANCELLED") return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-yellow-400" />;
};

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({
  order,
  onClose,
  onUpdated,
}: {
  order: ApiOrder;
  onClose: () => void;
  onUpdated: (o: ApiOrder) => void;
}) {
  const [modelData, setModelData] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState<"approve" | "revise" | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/orders/${order.OrderId}/attachments`);
        if (res.ok) {
          const list = (await res.json()).data ?? [];
          setAttachments(list);
          const objFile = list.find((a: Attachment) => {
            const name = a.FileName.toLowerCase();
            return name.endsWith(".obj") || name.endsWith(".zip") || name.endsWith(".blend") || name.endsWith(".glb") || name.endsWith(".gltf");
          });
          if (objFile) {
            const fileRes = await apiFetch(`/attachments/${objFile.AttachmentId}`);
            if (fileRes.ok) {
              const fileData = await fileRes.json();
              setModelData(fileData.data?.Base64Data ?? fileData.Base64Data ?? null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load attachments or model data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadModel();
  }, [order.OrderId]);

  const handleAction = async (action: "approve" | "revise") => {
    if (action === "revise" && !feedback.trim()) {
      toast.error("Vui lòng nhập phản hồi cho yêu cầu chỉnh sửa.");
      return;
    }
    setSubmitting(action);
    try {
      const newStatus = action === "approve" ? "DELIVERED" : "IN_PRODUCTION";
      const updateBody: Record<string, unknown> = { Status: newStatus };
      if (action === "revise") {
        updateBody.Brief = `[REVISION FEEDBACK - ${new Date().toLocaleDateString()}]: ${feedback}\n\nOriginal Brief:\n${order.Brief || ""}`;
      }
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify(updateBody),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = (await res.json()).data;
      if (action === "approve") {
        toast.success("Đơn hàng đã được duyệt! Chuyển đến tab 'Mua hàng' để hoàn tất thanh toán.");
      } else {
        toast.success("Đã gửi yêu cầu chỉnh sửa thành công.");
      }
      onUpdated(updated);
      onClose();
    } catch {
      toast.error("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setSubmitting(null);
    }
  };

  const objFile = attachments.find((a) => {
    const name = a.FileName.toLowerCase();
    return name.endsWith(".obj") || name.endsWith(".zip") || name.endsWith(".blend") || name.endsWith(".glb") || name.endsWith(".gltf");
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          Review 3D Work: {order.ProjectName || order.ProductName}
        </span>
      }
      maxWidth="4xl"
    >
      <div className="p-6 flex flex-col md:flex-row gap-6 min-h-[400px]">
        {/* Left: 3D Preview */}
        <div className="flex-1 min-h-[400px] bg-black/40 rounded-xl border border-white/5 relative overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" color="blue" />
            </div>
          ) : modelData ? (
            <OBJModelViewer objData={modelData} />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
              <Package className="w-12 h-12 mb-2 opacity-20" />
              <p>Không tìm thấy mô hình 3D (.obj) để xem trước.</p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 bg-black/60 px-2 py-1 rounded">
            Di chuyển chuột để xoay • Cuộn để zoom
          </div>
        </div>

        {/* Right: Feedback & Decision */}
        <div className="w-full md:w-80 flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Phản hồi chỉnh sửa
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Cần thay đổi gì? (Màu sắc, hình dạng, chất liệu...)"
              rows={8}
              className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-700 focus:border-purple-500/50 outline-none transition"
            />
          </div>
          <div className="mt-auto space-y-3">
            <Button
              onClick={() => handleAction("revise")}
              disabled={!!submitting}
              variant="outline"
              className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 h-12 rounded-xl"
            >
              {submitting === "revise" ? <Loader2 className="animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Yêu cầu chỉnh sửa</>}
            </Button>
            <Button
              onClick={() => handleAction("approve")}
              disabled={!!submitting}
              className="w-full h-12 rounded-xl font-bold text-white"
              style={{ background: "var(--gradient-success)", boxShadow: "0 4px 24px rgba(16,163,74,0.2)" }}
            >
              {submitting === "approve" ? <Loader2 className="animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Duyệt & Hoàn tất</>}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function OrdersTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [reviewOrder, setReviewOrder] = useState<ApiOrder | null>(null);
  const { confirm, ConfirmDialogComponent } = useConfirm();

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
          setError(`Cannot load orders. (${e.message})`);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdated = (updated: ApiOrder) =>
    setOrders((prev) => prev.map((o) => (o.OrderId === updated.OrderId ? updated : o)));

  const handleDownloadAttachments = async (orderId: number) => {
    setDownloading(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/attachments`);
      if (!res.ok) throw new Error("Failed to fetch attachments");
      const attachments: Attachment[] = (await res.json()).data ?? [];
      if (attachments.length === 0) { toast.warning("No deliverables found for this order."); return; }
      
      for (const att of attachments) {
        const fileRes = await apiFetch(`/attachments/${att.AttachmentId}`);
        if (!fileRes.ok) throw new Error(`Failed to fetch file content for ${att.FileName}`);
        const fileData = await fileRes.json();
        const fullAtt = fileData.data ?? fileData;
        
        if (fullAtt.Base64Data) {
          try {
            // Remove data:mime/type;base64, if present
            const base64Data = fullAtt.Base64Data.includes(',') ? fullAtt.Base64Data.split(',')[1] : fullAtt.Base64Data;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/octet-stream" });
            const blobUrl = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = fullAtt.FileName || `delivery_${orderId}.obj`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          } catch (err) {
            console.error("Failed to decode base64 data:", err);
            toast.error(`Failed to process file ${fullAtt.FileName} for download.`);
          }
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to download deliverables.");
    } finally {
      setDownloading(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    const ok = await confirm({
      title: "Hủy đơn hàng",
      message: "Bạn có chắc chắn muốn hủy đơn hàng này không? Hành động này không thể hoàn tác.",
      confirmLabel: "Hủy đơn",
      cancelLabel: "Giữ đơn",
      variant: "danger",
    });
    if (!ok) return;
    setCancelling(orderId);
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, { method: "PUT" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message ?? "Cancel failed"); }
      setOrders((prev) => prev.map((o) => (o.OrderId === orderId ? { ...o, Status: "CANCELLED" } : o)));
      toast.success("Đã hủy đơn hàng thành công.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không thể hủy đơn hàng.");
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <LoadingSpinner size="md" color="cyan" fullPage />;

  if (error) return <ErrorState message={error} onRetry={fetchOrders} />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Chưa có đơn hàng"
        description="Đặt đơn hàng tuỳ chỉnh đầu tiên của bạn để bắt đầu"
        action={
          <Button 
            onClick={() => router.push("/order")}
            style={{ background: "var(--gradient-accent)" }} 
            className="text-white"
          >
            Đặt đơn mới
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={fetchOrders} variant="outline" size="sm" className="border-slate-600 text-slate-300">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Làm mới
        </Button>
      </div>

      {orders.map((order) => {
        const progress = getOrderProgress(order.Status);
        return (
          <Card key={order.OrderId} className="bg-slate-800/50 border-blue-500/20 backdrop-blur">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-900/50 border border-white/[0.06]">
                    <StatusIcon status={order.Status} />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-white mb-2 truncate">
                      {order.ProjectName || order.ProductName || `Order #${order.OrderId}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <StatusBadge status={order.Status} config={ORDER_STATUS_CONFIG} />
                      <span className="text-sm text-gray-400">• #{order.OrderId}</span>
                      {order.PackageName && <span className="text-sm text-gray-400">• {order.PackageName}</span>}
                    </div>
                    <div className="space-y-1">
                      {order.Status !== "CANCELLED" && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>Tiến độ:</span>
                          <div className="w-32"><Progress value={progress} className="h-2" /></div>
                          <span>{progress}%</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-sm text-gray-400">
                        <span>Ngày tạo: {new Date(order.CreatedAt).toLocaleDateString("vi-VN")}</span>
                        {order.DeliverySpeed && <span className="text-yellow-400">Tốc độ: {order.DeliverySpeed}</span>}
                        {order.Budget && <span className="text-green-400">Ngân sách: {order.Budget}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  {order.Status === "COMPLETED" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-500 text-white"
                        onClick={() => handleDownloadAttachments(order.OrderId)}
                        disabled={downloading === order.OrderId}
                      >
                        {downloading === order.OrderId ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                        Tải tệp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        onClick={() => onTabChange ? onTabChange("purchases") : (window.location.href = "/customer-dashboard?tab=purchases")}
                      >
                        <ShoppingBag className="w-4 h-4 mr-1.5" /> Hoàn tiền
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                        onClick={() => { toast.info("Order closed and moved to history."); handleUpdated({ ...order }); }}
                      >
                        <Archive className="w-4 h-4 mr-1.5" /> Đóng
                      </Button>
                    </>
                  )}
                  {order.Status === "DELIVERED" && (
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-[10px] text-yellow-400 font-medium font-mono">ĐÃ DUYỆT - ĐᨌI THANH TOÁN</p>
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-500 text-white"
                        onClick={() => toast.info("💳 Thanh toán hiện đang được triển khai để tích hợp (Coming Soon)", { duration: 4000 })}
                      >
                        <ShoppingBag className="w-4 h-4 mr-1.5" /> Thanh toán ngay
                      </Button>
                    </div>
                  )}
                  {order.Status === "REVIEW" && (
                    order.Brief?.includes("[SENT_TO_CUSTOMER]") ? (
                      <Button
                        size="sm"
                        className="text-white"
                        style={{ background: "var(--gradient-brand)" }}
                        onClick={() => setReviewOrder(order)}
                      >
                        <Eye className="w-4 h-4 mr-2" /> Xem xét sản phẩm
                      </Button>
                    ) : (
                      <span className="text-xs bg-slate-700/50 text-slate-400 border border-slate-600/30 rounded-xl px-3 py-1.5 font-medium">
                        Đang chờ quản lý kiểm duyệt
                      </span>
                    )
                  )}
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
                        : <><XCircle className="w-4 h-4 mr-1" />Hủy</>}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {order.Brief && (
              <CardContent className="pt-0">
                <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-3">
                  <p className="text-slate-500 text-xs mb-1">Mô tả tóm tắt</p>
                  <p className="text-slate-300 text-sm line-clamp-2 italic">{order.Brief}</p>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onUpdated={handleUpdated}
        />
      )}
      {ConfirmDialogComponent}
    </div>
  );
}
