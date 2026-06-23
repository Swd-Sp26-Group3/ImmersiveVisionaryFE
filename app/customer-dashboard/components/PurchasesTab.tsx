"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { FilterPills } from "@/app/components/ui/filter-pills";
import { InfoGrid } from "@/app/components/ui/info-grid";
import { useConfirm } from "@/app/components/ui/confirm-dialog";
import { motion } from "framer-motion";
import {
  ShoppingBag, Box, DollarSign, Clock, ChevronRight, CheckCircle2,
  RotateCcw, Download, CreditCard, Loader2, AlertCircle, Copy,
} from "lucide-react";
import { toast } from "sonner";
import type { MarketplaceOrder, AssetVersion } from "@/lib/types";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bgColor: string; borderColor: string;
  description: string; canDownload: boolean; icon: React.ReactNode;
}> = {
  PENDING: {
    label: "Chờ thanh toán",
    color: "text-yellow-300", bgColor: "bg-yellow-500/15", borderColor: "border-yellow-500/30",
    description: "Đơn đã đặt — chưa xác nhận thanh toán. Nếu bạn vừa thanh toán, vui lòng làm mới trang.",
    canDownload: false, icon: <Clock className="w-3.5 h-3.5" />,
  },
  PAID: {
    label: "Đã thanh toán — Sẵn sàng tải",
    color: "text-green-300", bgColor: "bg-green-500/15", borderColor: "border-green-500/30",
    description: "Đã xác nhận thanh toán. Tài sản của bạn sẵn sàng để tải xuống.",
    canDownload: true, icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  DELIVERED: {
    label: "Đã giao",
    color: "text-cyan-300", bgColor: "bg-cyan-500/15", borderColor: "border-cyan-500/30",
    description: "Tài sản đã được giao và có thể tải xuống.",
    canDownload: true, icon: <Download className="w-3.5 h-3.5" />,
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    color: "text-red-300", bgColor: "bg-red-500/15", borderColor: "border-red-500/30",
    description: "Đơn hàng này đã được hoàn tiền.",
    canDownload: false, icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
};

const FORMAT_COLOR: Record<string, string> = {
  GLB:   "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  USDZ:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  FBX:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  WEBAR: "bg-green-500/20 text-green-300 border-green-500/30",
};

const FILTER_OPTIONS = [
  { value: "ALL",       label: "Tất cả" },
  { value: "PENDING",   label: "Chờ" },
  { value: "PAID",      label: "Đã thanh toán" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "REFUNDED",  label: "Đã hoàn tiền" },
];

// ── Order Detail Panel ────────────────────────────────────────────────────────
function OrderDetail({
  order, onBack, onRefunded,
}: {
  order: MarketplaceOrder;
  onBack: () => void;
  onRefunded: (updated: MarketplaceOrder) => void;
}) {
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [vLoading, setVLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const { confirm: _confirm, ConfirmDialogComponent } = useConfirm();
  const [showQR, setShowQR] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Poll payment status when QR code is shown
  useEffect(() => {
    if (!showQR || !paymentId) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await apiFetch(`/payments/${paymentId}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.data ?? data;
          if (p.qrUrl) {
            setQrUrl(p.qrUrl);
          }
          if (p.PaymentStatus === "PAID") {
            clearInterval(intervalId);
            setShowQR(false);
            toast.success("Thanh toán thành công!");
            // Refresh order status in UI
            onRefunded({ ...order, Status: "PAID" });
          }
        }
      } catch (err) {
        console.error("Error polling payment status:", err);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [showQR, paymentId, order, onRefunded]);

  const cfg = STATUS_CONFIG[order.Status];

  useEffect(() => {
    if (!cfg.canDownload) return;
    setVLoading(true);
    apiFetch(`/asset-versions/${order.AssetId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setVersions(d.data ?? d); })
      .catch(() => {})
      .finally(() => setVLoading(false));
  }, [order.AssetId, cfg.canDownload]);

  const handleDownload = async (versionId: number) => {
    try {
      const res = await apiFetch(`/asset-versions/${versionId}/download`);
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.message);
      
      const downloadData = resJson.data ?? resJson;
      const base64Data = downloadData.Base64Data;
      const fileName = downloadData.downloadUrl || `version_${versionId}.zip`;

      if (base64Data) {
        // Decode base64 and trigger local download
        let rawBase64 = base64Data;
        if (rawBase64.includes(',')) {
          rawBase64 = rawBase64.split(',')[1];
        } else if (rawBase64.includes(':')) {
          rawBase64 = rawBase64.split(':')[1];
        }
        const byteCharacters = atob(rawBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/octet-stream" });
        const blobUrl = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else if (downloadData.downloadUrl) {
        // Fallback to absolute/relative URL
        window.open(downloadData.downloadUrl, "_blank");
      } else {
        toast.warning("Download data not available.");
      }
    } catch (err: unknown) {
      setError(`Download failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePayNow = async () => {
    setPaying(true);
    setError("");
    try {
      // BUG FIX: Must include MpOrderId in the payment so the SePay webhook
      // can parse "DH{MpOrderId}" from the transfer content and match it.
      const payRes = await apiFetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AssetId: order.AssetId,
          MpOrderId: order.MpOrderId,   // ← critical fix
          OrderId: null,
          Amount: order.Price,
          PaymentType: "ASSET",
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.message ?? "Failed to create payment");
      const p = payData.data ?? payData;
      const pid = p.PaymentId ?? p.paymentId ?? null;
      if (p.qrUrl) {
        setQrUrl(p.qrUrl);
      }

      setPaymentId(pid);
      setShowQR(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment initiation failed.");
    } finally {
      setPaying(false);
    }
  };

  const infoItems = [
    { label: "Mã đơn",      value: `#${order.MpOrderId}` },
    { label: "Tên tài sản", value: order.AssetName || "Tài sản 3D" },
    { label: "Danh mục",    value: order.Category || "Nội dung 3D/AR" },
    { label: "Ngành",       value: order.Industry || "Tổng quát" },
    { label: "Người bán",   value: order.SellerCompanyName || "Nhà cung cấp" },
    { label: "Giá",         value: order.Price != null ? `${order.Price.toLocaleString("vi-VN")} ₫` : "—" },
    { label: "Ngày mua",    value: new Date(order.CreatedAt).toLocaleDateString("vi-VN") },
  ];

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm">
        ← Quay lại danh sách mua hàng
      </button>

      <div className="rounded-2xl border border-white/10 bg-[var(--surface-2)] overflow-hidden">
        <div className="h-1" style={{ background: "var(--gradient-accent)" }} />
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Box className="w-4 h-4 text-cyan-400" />
                <h2 className="text-white font-bold text-xl">{order.AssetName || "3D Marketplace Asset"}</h2>
              </div>
              <p className="text-slate-500 text-sm">Mã đơn: #{order.MpOrderId}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <InfoGrid items={infoItems} cols={3} />

          {/* Status description */}
          <div className={`rounded-xl ${cfg.bgColor} ${cfg.borderColor} border p-3 flex gap-2 text-xs ${cfg.color}`}>
            {cfg.icon}
            <span>{cfg.description}</span>
          </div>

          {/* Pay Now for PENDING */}
          {order.Status === "PENDING" && (
            <Button
              onClick={handlePayNow}
              disabled={paying}
              className="w-full text-white font-semibold py-6 rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg,#eab308,#ea580c)", boxShadow: "0 4px 20px rgba(234,88,12,0.2)" }}
            >
              {paying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="w-4 h-4 mr-2" />
              )}
              Thanh toán ngay ({order.Price?.toLocaleString("vi-VN")} ₫)
            </Button>
          )}

          {/* Download section */}
          {cfg.canDownload && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> Tải tệp
              </p>
              {vLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <LoadingSpinner size="sm" color="slate" /> Đang tải tệp…
                </div>
              ) : versions.length === 0 ? (
                <div className="rounded-xl bg-slate-900/50 border border-white/[0.08] p-4 text-center">
                  <p className="text-slate-500 text-sm">Chưa có tệp nào được tải lên.</p>
                  <p className="text-slate-600 text-xs mt-1">Liên hệ hỗ trợ nếu vấn đề tiếp diễn.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.VersionId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/[0.08] hover:border-cyan-500/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${FORMAT_COLOR[v.FileFormat] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
                          {v.FileFormat}
                        </span>
                        <span className="text-slate-400 text-xs">v{v.VersionId}</span>
                      </div>
                      {v.FileUrl ? (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(v.VersionId)}
                          className="text-xs px-3 text-white"
                          style={{ background: "var(--gradient-accent)" }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Tải xuống
                        </Button>
                      ) : (
                        <span className="text-slate-600 text-xs">Không có sẵn</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}



        </div>
      </div>
      {ConfirmDialogComponent}

      {/* VietQR / SePay Payment Dialog */}
      {showQR && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 text-white overflow-y-auto max-h-[90vh]"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">Quét QR thanh toán đơn hàng</h3>
              <p className="text-slate-400 text-xs mt-1">
                Quét mã bên dưới bằng ứng dụng ngân hàng của bạn
              </p>
            </div>

             {/* QR Code */}
            <div className="bg-white p-3 rounded-xl max-w-[240px] mx-auto shadow-inner">
              <img
                src={qrUrl || `https://qr.sepay.vn/img?acc=109879775018&bank=VietinBank&amount=${order.Price}&des=SEVQR+TKPIMV+DH${paymentId}`}
                alt="VietQR Payment Code"
                className="w-full h-auto rounded-lg"
              />
            </div>

            {/* Account Details */}
            <div className="rounded-lg bg-slate-900/60 border border-white/5 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng</span>
                <span className="font-semibold text-slate-300">VietinBank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản</span>
                <span className="font-semibold text-slate-300">LE NGUYEN TUAN KHOA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-slate-300">109879775018</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("109879775018");
                      toast.success("Đã sao chép số tài khoản");
                    }}
                    className="text-cyan-400 hover:text-cyan-300 p-0.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền</span>
                <span className="font-bold text-cyan-400">
                  {order.Price?.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nội dung CK</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-yellow-400">SEVQR TKPIMV DH{paymentId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`SEVQR TKPIMV DH${paymentId}`);
                      toast.success("Đã sao chép nội dung");
                    }}
                    className="text-cyan-400 hover:text-cyan-300 p-0.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Check status loading indicator */}
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Hệ thống đang kiểm tra tự động...</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!paymentId) return;
                    setPaying(true);
                    try {
                      // Fetch status to verify webhook processed it
                      const res = await apiFetch(`/payments/${paymentId}`);
                      if (!res.ok) throw new Error("Không thể kiểm tra trạng thái thanh toán.");
                      const data = await res.json();
                      const payment = data.data ?? data;

                      if (payment.PaymentStatus === "PAID") {
                        setShowQR(false);
                        toast.success("Thanh toán thành công!");
                        onRefunded({ ...order, Status: "PAID" });
                      } else {
                        toast.error("Giao dịch chuyển khoản chưa được ghi nhận. Vui lòng đợi trong giây lát hoặc kiểm tra lại.");
                      }
                    } catch (err: any) {
                      toast.error(err.message ?? "Không thể xác nhận giao dịch. Vui lòng thử lại.");
                    } finally {
                      setPaying(false);
                    }
                  }}
                  disabled={paying}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white py-4 text-xs font-semibold rounded-xl"
                >
                  Tôi đã chuyển khoản
                </Button>
                <Button
                  onClick={() => setShowQR(false)}
                  variant="outline"
                  className="border-slate-800 text-slate-400 hover:text-white py-4 text-xs px-4"
                >
                  Đóng
                </Button>
              </div>


            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Main PurchasesTab ─────────────────────────────────────────────────────────
export function PurchasesTab() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MarketplaceOrder | null>(null);
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = () => {
    setLoading(true);
    setError("");
    apiFetch("/marketplace-orders/my")
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text();
          if (r.status === 400 && (text.includes("company") || text.includes("Buyer company not found"))) {
            return { data: [] };
          }
          throw new Error(text);
        }
        return r.json();
      })
      .then((d) => setOrders(Array.isArray(d.data ?? d) ? (d.data ?? d) : []))
      .catch((e) => { if (!e.message.includes("company")) setError(`Cannot load purchases. (${e.message})`); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const [retryCount, setRetryCount] = useState(0);

  // Auto-select order based on orderId URL query parameter (for custom order payments)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get("orderId");
      if (orderIdParam && orders.length > 0) {
        const numericId = Number(orderIdParam);
        // Try matching by CreativeOrder.OrderId (stored in Asset3D.OrderId → joined as OrderId)
        // Fall back to MpOrderId for direct marketplace order links
        const matching = orders.find(
          (o) => Number(o.OrderId) === numericId || Number(o.MpOrderId) === numericId
        );
        if (matching) {
          setSelected(matching);
          // Clean up the URL parameter without page reload
          const newUrl = window.location.pathname + "?tab=purchases";
          window.history.pushState({}, "", newUrl);
        } else if (retryCount < 2) {
          // If not found yet, backend might still be reconciling the DELIVERED order.
          // Retry fetching orders after 1.5 seconds.
          const timer = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchOrders();
          }, 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [orders, retryCount]);


  const handleRefunded = (updated: MarketplaceOrder) => {
    setOrders((prev) => prev.map((o) => (o.MpOrderId === updated.MpOrderId ? updated : o)));
    setSelected(updated);
  };

  if (selected) {
    return <OrderDetail order={selected} onBack={() => setSelected(null)} onRefunded={handleRefunded} />;
  }

  const filtered = filter === "ALL" ? orders : orders.filter((o) => o.Status === filter);
  const paidCount = orders.filter((o) => o.Status === "PAID" || o.Status === "DELIVERED").length;
  const pendingCount = orders.filter((o) => o.Status === "PENDING").length;

  // Counts for filter pills
  const counts = FILTER_OPTIONS.reduce((acc, opt) => {
    if (opt.value !== "ALL") acc[opt.value] = orders.filter((o) => o.Status === opt.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-400" /> Mua hàng của tôi
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Các đơn mua tài sản trên Marketplace</p>
        </div>
        <div className="flex items-center gap-2">
          {paidCount > 0 && (
            <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 rounded-full px-2.5 py-1 flex items-center gap-1">
              <Download className="w-3 h-3" /> {paidCount} sẵn sàng tải
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full px-2.5 py-1">
              {pendingCount} chờ thanh toán
            </span>
          )}
          <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
            <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <FilterPills options={FILTER_OPTIONS} value={filter} onChange={setFilter} counts={counts} />

      {/* List */}
      {loading ? (
        <LoadingSpinner size="md" color="purple" fullPage />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Chưa có đơn mua hàng"
          description="Khám phá Marketplace để tìm tài sản 3D/AR"
          action={
            <button
              onClick={() => window.location.href = "/marketplace"}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition"
              style={{ background: "var(--gradient-accent)" }}
            >
              <ShoppingBag className="w-4 h-4" /> Khám phá Marketplace
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const cfg = STATUS_CONFIG[order.Status];
            return (
              <motion.div
                key={order.MpOrderId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(order)}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-blue-500/20 hover:border-purple-500/30 transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-xl ${cfg.bgColor} ${cfg.borderColor} border flex items-center justify-center flex-shrink-0`}>
                  <Box className={`w-5 h-5 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{order.AssetName || "3D Marketplace Asset"}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
                    <span>Order #{order.MpOrderId}</span>
                    {order.Price != null && (
                      <><span>·</span>
                        <span className="text-green-400 flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3" />{order.Price.toLocaleString("vi-VN")} ₫
                        </span></>
                    )}
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />{new Date(order.CreatedAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`}>
                    {cfg.icon}
                    <span className="hidden sm:inline">{cfg.label.split(" ")[0]}</span>
                  </span>
                  {cfg.canDownload && (
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}