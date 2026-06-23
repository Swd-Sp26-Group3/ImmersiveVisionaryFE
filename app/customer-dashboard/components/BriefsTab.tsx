"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, formatBudgetToPrice } from "@/lib/api";
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
  Eye, Loader2, RefreshCw, Download, ShoppingBag,
} from "lucide-react";
// Link not used here
import { ApiOrder, ORDER_STATUS_CONFIG, getOrderProgress } from "./types";
import type { Attachment } from "@/lib/types";
import OBJModelViewer from "../../components/3d/OBJModelViewer";
import { toast } from "sonner";

/** Customer can cancel only within 24 h of creation */
const canCancelOrder = (createdAt: string): boolean => {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created < 24 * 60 * 60 * 1000; // 24 hours in ms
};

/** Pretty-print remaining cancel window */
const cancelRemainingTime = (createdAt: string): string => {
  const deadline = new Date(createdAt).getTime() + 24 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return "";
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

/** Compute how many days remain until a deadline date */
const daysUntilDeadline = (deadline: string | null): number | null => {
  if (!deadline) return null;
  const remaining = new Date(deadline).getTime() - Date.now();
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (1000 * 60 * 60 * 24));
};

export function BriefsTab({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const router = useRouter();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  // Preview now also carries the parent order for feedback submission
  const [showPreview, setShowPreview] = useState<{ attachment: Attachment; order: ApiOrder } | null>(null);
  const [previewingOrderId, setPreviewingOrderId] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handlePreview3D = async (order: ApiOrder) => {
    setLoadingPreview(true);
    setPreviewingOrderId(order.OrderId);
    setFeedback("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/attachments`);
      if (!res.ok) throw new Error("Could not load attachments");
      const data = await res.json();
      const attachments: Attachment[] = data.data ?? data;
      const objFile = attachments.find((a) => {
        const name = a.FileName.toLowerCase();
        return name.endsWith(".obj") || name.endsWith(".zip") || name.endsWith(".blend") || name.endsWith(".glb") || name.endsWith(".gltf");
      });
      if (objFile) {
        const detailRes = await apiFetch(`/attachments/${objFile.AttachmentId}`);
        if (!detailRes.ok) throw new Error("Could not load 3D model data");
        const detailData = await detailRes.json();
        const fullObjFile = detailData.data ?? detailData;
        setShowPreview({ attachment: fullObjFile, order });
      } else {
        toast.warning("Artist chưa tải bản nháp lên. Hãy chờ artist gửi bản xem trước.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load 3D preview.");
    } finally {
      setLoadingPreview(false);
      setPreviewingOrderId(null);
    }
  };

  const handleFeedbackSubmit = async (action: "approve" | "revise") => {
    if (!showPreview) return;
    if (action === "revise" && !feedback.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi trước khi gửi.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      const newStatus = action === "approve" ? "DELIVERED" : "IN_PRODUCTION";
      const body: Record<string, unknown> = { Status: newStatus };
      if (action === "revise") {
        body.Brief = `[REVISION - ${new Date().toLocaleDateString("vi-VN")}]: ${feedback}\n\n${showPreview.order.Brief || ""}`;
      }
      const res = await apiFetch(`/orders/${showPreview.order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Update failed");
      if (action === "approve") {
        toast.success("Đã duyệt! Đơn sẽ chuyển sang Thanh toán.");
      } else {
        toast.success("Đã gửi yêu cầu chỉnh sửa cho Artist.");
      }
      setOrders((prev) =>
        prev.map((o) =>
          o.OrderId === showPreview.order.OrderId ? { ...o, Status: newStatus as ApiOrder["Status"] } : o
        )
      );
      setShowPreview(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật trạng thái.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

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
      title: "Hủy đơn hàng",
      message: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      confirmLabel: "Có, Hủy",
      cancelLabel: "Giữ lại",
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
      toast.success("Đã hủy đơn hàng.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không thể hủy đơn hàng.");
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
            <FileText className="w-4 h-4 text-blue-400" /> Yêu cầu / Đơn tùy chỉnh của tôi
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Theo dõi các yêu cầu sản xuất 3D/AR tùy chỉnh của bạn</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Button
            onClick={() => router.push("/order")}
            className="text-sm text-white"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Plus className="w-4 h-4 mr-1" /> Yêu cầu mới
          </Button>
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
          title="Chưa có đơn tùy chỉnh"
          description="Gửi yêu cầu để bắt đầu sản xuất 3D/AR tùy chỉnh"
          action={
            <Button 
              onClick={() => router.push("/order")}
              className="text-white" 
              style={{ background: "var(--gradient-accent)" }}
            >
              <Plus className="w-4 h-4 mr-2" /> Tạo yêu cầu đầu tiên
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
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
                        {order.Budget && (
                          <span className="text-green-400 text-xs font-semibold">
                            Ngân sách: {order.Budget} 
                            {(order.Status === "DELIVERED" || order.Status === "COMPLETED") && (
                              <span className="text-white font-bold ml-1">
                                (Thành tiền: {formatBudgetToPrice(order.Budget)})
                              </span>
                            )}
                          </span>
                        )}
                        {order.DeliverySpeed && <span className="text-yellow-400 text-xs">{order.DeliverySpeed}</span>}
                      </div>
                    </div>
                  </div>
                  {/* Cancel button - only within 24h of creation */}
                  {(order.Status === "NEW" || order.Status === "IN_PRODUCTION") && (
                    canCancelOrder(order.CreatedAt) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-shrink-0"
                        onClick={() => handleCancel(order.OrderId)}
                        disabled={cancelling === order.OrderId}
                        title={`Còn ${cancelRemainingTime(order.CreatedAt)} để hủy`}
                      >
                        {cancelling === order.OrderId
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <><XCircle className="w-4 h-4 mr-1" />Hủy ({cancelRemainingTime(order.CreatedAt)})</>}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-600 border border-slate-700/50 rounded-lg px-2 py-1 flex-shrink-0" title="Đã quá 24h kể từ khi tạo đơn">
                        Không thể hủy
                      </span>
                    )
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

                <div className="mt-3 flex gap-2 flex-wrap items-center">
                  {/* ── REVIEW: customer can view draft and give feedback ── */}
                  {order.Status === "REVIEW" && (
                    <Button
                      size="sm"
                      className="text-white text-xs"
                      style={{ background: "var(--gradient-brand)" }}
                      onClick={() => handlePreview3D(order)}
                      disabled={loadingPreview && previewingOrderId === order.OrderId}
                    >
                      {loadingPreview && previewingOrderId === order.OrderId
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        : <Eye className="w-3 h-3 mr-1" />}
                      Xem bản nháp của Artist
                    </Button>
                  )}

                  {/* ── IN_PRODUCTION / NEW: show ETA note from deadline ── */}
                  {(order.Status === "IN_PRODUCTION" || order.Status === "NEW") && (() => {
                    const days = daysUntilDeadline(order.Deadline);
                    if (days === null) return null;
                    return (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {days > 0
                          ? `Bản nháp dự kiến trong ~${days} ngày`
                          : "Bản nháp đang được hoàn thiện..."}
                      </span>
                    );
                  })()}

                  {/* ── COMPLETED / DELIVERED: download ── */}
                  {(order.Status === "COMPLETED" || order.Status === "DELIVERED") && (
                    <Button
                      size="sm"
                      className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs"
                      onClick={() => handlePreview3D(order)}
                      disabled={loadingPreview && previewingOrderId === order.OrderId}
                    >
                      {loadingPreview && previewingOrderId === order.OrderId
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        : <Eye className="w-3 h-3 mr-1" />}
                      Xem Preview 3D
                    </Button>
                  )}
                  {order.Status === "DELIVERED" && (
                    <Button
                      size="sm"
                      className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold animate-pulse"
                      onClick={() => {
                        toast.success("Đang chuyển hướng sang mục Mua hàng để thanh toán...");
                        const targetUrl = `/customer-dashboard?tab=purchases&orderId=${order.OrderId}`;
                        router.push(targetUrl);
                      }}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1" /> Thanh toán ngay
                    </Button>
                  )}
                  {order.Status === "COMPLETED" && (
                    <Button
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
                      onClick={() => handleDownloadAttachments(order.OrderId)}
                      disabled={downloading === order.OrderId}
                    >
                      {downloading === order.OrderId ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Download className="w-3 h-3 mr-1.5" />}
                      Tải tệp
                    </Button>
                  )}
                </div>

                <p className="text-slate-600 text-[10px] mt-3">
                  Ngày tạo {new Date(order.CreatedAt).toLocaleDateString("vi-VN", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 3D Preview + Feedback Modal */}
      <Modal
        open={!!showPreview}
        onClose={() => setShowPreview(null)}
        title={
          showPreview ? (
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              {showPreview.order.Status === "REVIEW"
                ? `Xem bản nháp: ${showPreview.attachment.FileName}`
                : `3D Preview: ${showPreview.attachment.FileName}`}
            </span>
          ) : undefined
        }
        maxWidth="4xl"
      >
        {showPreview && (
          <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            {/* 3D Viewer */}
            <div className="flex-1 min-h-[350px]">
              <OBJModelViewer objData={showPreview.attachment.Base64Data} />
              <p className="text-[10px] text-slate-500 mt-2 text-center">Di chuyển chuột để xoay • Cuộn để zoom</p>
            </div>

            {/* Feedback panel — only shown for REVIEW status */}
            {showPreview.order.Status === "REVIEW" && (
              <div className="w-full md:w-72 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Phản hồi chỉnh sửa
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Cần thay đổi gì? (Màu sắc, hình dạng, chất liệu...)"
                    rows={7}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:border-purple-500/50 outline-none transition resize-none"
                  />
                </div>
                <div className="mt-auto space-y-2">
                  <Button
                    onClick={() => handleFeedbackSubmit("revise")}
                    disabled={submittingFeedback}
                    variant="outline"
                    className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 rounded-xl"
                  >
                    {submittingFeedback
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><RefreshCw className="w-4 h-4 mr-2" />Yêu cầu chỉnh sửa</>}
                  </Button>
                  <Button
                    onClick={() => handleFeedbackSubmit("approve")}
                    disabled={submittingFeedback}
                    className="w-full rounded-xl font-bold text-white"
                    style={{ background: "var(--gradient-success)", boxShadow: "0 4px 20px rgba(16,163,74,0.2)" }}
                  >
                    {submittingFeedback
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><CheckCircle2 className="w-4 h-4 mr-2" />Duyệt bản này</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {ConfirmDialogComponent}
    </div>
  );
}