"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { motion } from "framer-motion";
import {
  ShoppingBag, Loader2, AlertCircle, RefreshCw,
  Box, DollarSign, Clock, ChevronRight, CheckCircle2,
  RotateCcw, Download, ExternalLink, CreditCard
} from "lucide-react";

interface MarketplaceOrder {
  MpOrderId: number;
  AssetId: number;
  BuyerCompanyId: number;
  SellerCompanyId: number;
  Price: number | null;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  CreatedAt: string;
  AssetName?: string | null;
  SellerCompanyName?: string | null;
}

interface AssetVersion {
  VersionId: number;
  FileFormat: "GLB" | "USDZ" | "FBX" | "WEBAR";
  FileUrl: string | null;
}

// Status theo đúng flow của doc
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bgColor: string; borderColor: string;
  description: string; canDownload: boolean; icon: React.ReactNode;
}> = {
  PENDING: {
    label: "Pending Payment",
    color: "text-yellow-300", bgColor: "bg-yellow-500/15", borderColor: "border-yellow-500/30",
    description: "Order placed — payment not yet confirmed. If you just paid, please refresh.",
    canDownload: false,
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  PAID: {
    label: "Paid — Ready to Download",
    color: "text-green-300", bgColor: "bg-green-500/15", borderColor: "border-green-500/30",
    description: "Payment confirmed. Your asset is ready for download now.",
    canDownload: true,
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  DELIVERED: {
    label: "Delivered",
    color: "text-cyan-300", bgColor: "bg-cyan-500/15", borderColor: "border-cyan-500/30",
    description: "Asset delivered and available for download.",
    canDownload: true,
    icon: <Download className="w-3.5 h-3.5" />,
  },
  REFUNDED: {
    label: "Refunded",
    color: "text-red-300", bgColor: "bg-red-500/15", borderColor: "border-red-500/30",
    description: "This order has been refunded.",
    canDownload: false,
    icon: <RotateCcw className="w-3.5 h-3.5" />,
  },
};

const FORMAT_COLOR: Record<string, string> = {
  GLB: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  USDZ: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  FBX: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  WEBAR: "bg-green-500/20 text-green-300 border-green-500/30",
};

// ── Order Detail Panel ────────────────────────────────────────────────
function OrderDetail({
  order, onBack, onRefunded,
}: {
  order: MarketplaceOrder;
  onBack: () => void;
  onRefunded: (updated: MarketplaceOrder) => void;
}) {
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [vLoading, setVLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const cfg = STATUS_CONFIG[order.Status];

  // Load versions nếu đã paid
  useEffect(() => {
    if (!cfg.canDownload) return;
    setVLoading(true);
    apiFetch(`/asset-versions/${order.AssetId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setVersions(d.data ?? d); })
      .catch(() => { })
      .finally(() => setVLoading(false));
  }, [order.AssetId, cfg.canDownload]);

  const handleDownload = async (versionId: number) => {
    try {
      const res = await apiFetch(`/asset-versions/${versionId}/download`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const url = data.data?.downloadUrl ?? data.downloadUrl;
      if (url) window.open(url, "_blank");
      else alert("Download URL not available.");
    } catch (err: any) {
      setError(`Download failed: ${err.message}`);
    }
  };

  const handleRefund = async () => {
    if (!confirm("Request a refund for this order?")) return;
    setRefunding(true); setError("");
    try {
      const res = await apiFetch(`/marketplace-orders/${order.MpOrderId}/refund`, { method: "PUT" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Refund failed");
      onRefunded(data.data ?? data);
    } catch (err: any) {
      setError(err.message ?? "Refund failed.");
    } finally {
      setRefunding(false);
    }
  };

  const handlePayNow = async () => {
    setPaying(true); setError("");
    try {
      // 1. Tạo payment record
      const payRes = await apiFetch("/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AssetId: order.AssetId,
          OrderId: null,
          Amount: order.Price,
          PaymentType: "ASSET",
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.message ?? "Failed to create payment");
      const pid = payData.data?.PaymentId ?? payData.paymentId;

      // 2. Tạo VNPay URL
      const vnpRes = await apiFetch("/payments/create-vnpay-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: pid,
          returnUrl: process.env.NEXT_PUBLIC_VNP_RETURN_URL || "http://localhost:3000/marketplace/checkout/vnpay-return"
        }),
      });
      console.log("VNPay Payment Initiation:", {
        paymentId: pid,
        returnUrl: process.env.NEXT_PUBLIC_VNP_RETURN_URL
      });
      const vnpData = await vnpRes.json();
      if (vnpRes.ok && vnpData.paymentUrl) {
        window.location.href = vnpData.paymentUrl;
      } else {
        throw new Error(vnpData.message ?? "Failed to create VNPay URL");
      }
    } catch (err: any) {
      setError(err.message ?? "Payment initiation failed.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm">
        ← Back to My Purchases
      </button>

      <div className="rounded-2xl border border-white/10 bg-slate-800/40 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        <div className="p-6 space-y-5">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Box className="w-4 h-4 text-cyan-400" />
                <h2 className="text-white font-bold text-xl">{order.AssetName ?? `Asset #${order.AssetId}`}</h2>
              </div>
              <p className="text-slate-500 text-sm">Order #{order.MpOrderId}</p>
            </div>
            <Badge className={`${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border text-xs px-3 py-1 flex items-center gap-1.5`}>
              {cfg.icon} {cfg.label}
            </Badge>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Order ID", value: `#${order.MpOrderId}` },
              { label: "Asset ID", value: `#${order.AssetId}` },
              { label: "Seller", value: order.SellerCompanyName ?? `#${order.SellerCompanyId}` },
              { label: "Amount", value: order.Price != null ? `${order.Price.toLocaleString("vi-VN")} ₫` : "—" },
              { label: "Placed", value: new Date(order.CreatedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/50 border border-white/6 rounded-xl p-3">
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Status description */}
          <div className={`rounded-xl ${cfg.bgColor} ${cfg.borderColor} border p-3 flex gap-2 text-xs ${cfg.color}`}>
            {cfg.icon}
            <span>{cfg.description}</span>
          </div>

          {/* Pay Now Button for PENDING */}
          {order.Status === "PENDING" && (
            <Button onClick={handlePayNow} disabled={paying}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-orange-500/20">
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" />Pay Now ({order.Price?.toLocaleString("vi-VN")} ₫)</>
              )}
            </Button>
          )}

          {/* ── Download section — only when PAID/DELIVERED ── */}
          {cfg.canDownload && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> Download Files
              </p>
              {vLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading files…
                </div>
              ) : versions.length === 0 ? (
                <div className="rounded-xl bg-slate-900/50 border border-white/8 p-4 text-center">
                  <p className="text-slate-500 text-sm">No files uploaded yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Contact support if this persists.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map(v => (
                    <div key={v.VersionId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/8 hover:border-cyan-500/30 transition">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs border ${FORMAT_COLOR[v.FileFormat] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
                          {v.FileFormat}
                        </Badge>
                        <span className="text-slate-400 text-xs">v{v.VersionId}</span>
                      </div>
                      {v.FileUrl ? (
                        <Button size="sm"
                          onClick={() => handleDownload(v.VersionId)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs px-3">
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                      ) : (
                        <span className="text-slate-600 text-xs">Not available</span>
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

          {/* Refund */}
          {(order.Status === "PAID" || order.Status === "DELIVERED") && (
            <Button onClick={handleRefund} disabled={refunding} variant="outline"
              className="w-full border-red-500/40 text-red-400 hover:text-red-300 hover:border-red-400 hover:bg-red-500/5">
              {refunding
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                : <><RotateCcw className="w-4 h-4 mr-2" />Request Refund</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main PurchasesTab ─────────────────────────────────────────────────
export function PurchasesTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MarketplaceOrder | null>(null);
  const [filter, setFilter] = useState("ALL");

  const fetchOrders = () => {
    setLoading(true); setError("");
    apiFetch("/marketplace-orders/my")
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => setOrders(Array.isArray(d.data ?? d) ? (d.data ?? d) : []))
      .catch(e => setError(`Cannot load purchases. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleRefunded = (updated: MarketplaceOrder) => {
    setOrders(prev => prev.map(o => o.MpOrderId === updated.MpOrderId ? updated : o));
    setSelected(updated);
  };

  if (selected) {
    return <OrderDetail order={selected} onBack={() => setSelected(null)} onRefunded={handleRefunded} />;
  }

  const filtered = filter === "ALL" ? orders : orders.filter(o => o.Status === filter);
  const paidCount = orders.filter(o => o.Status === "PAID" || o.Status === "DELIVERED").length;
  const pendingCount = orders.filter(o => o.Status === "PENDING").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-400" /> My Purchases
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Your marketplace asset orders</p>
        </div>
        <div className="flex items-center gap-2">
          {paidCount > 0 && (
            <span className="text-xs bg-green-500/20 text-green-300 border border-green-500/30 rounded-full px-2.5 py-1 flex items-center gap-1">
              <Download className="w-3 h-3" /> {paidCount} ready to download
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full px-2.5 py-1">
              {pendingCount} pending
            </span>
          )}
          <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "PENDING", "PAID", "DELIVERED", "REFUNDED"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${filter === s
              ? "bg-purple-600 border-purple-600 text-white"
              : "border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
              }`}
          >
            {s === "ALL" ? "All" : STATUS_CONFIG[s]?.label.split(" ")[0] ?? s}
            {s !== "ALL" && <span className="ml-1 opacity-50">({orders.filter(o => o.Status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={fetchOrders} className="text-slate-400 hover:text-white text-sm">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium mb-1">No purchases yet</p>
          <p className="text-slate-600 text-sm mb-5">Browse the marketplace to find 3D/AR assets</p>
          <button onClick={() => router.push("/marketplace")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-cyan-400 hover:to-blue-500 transition">
            <ShoppingBag className="w-4 h-4" /> Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const cfg = STATUS_CONFIG[order.Status];
            return (
              <motion.div key={order.MpOrderId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(order)}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-blue-500/20 hover:border-purple-500/30 transition-all cursor-pointer group"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${cfg.bgColor} ${cfg.borderColor} border flex items-center justify-center flex-shrink-0`}>
                  <Box className={`w-5 h-5 ${cfg.color}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {order.AssetName ?? `Asset #${order.AssetId}`}
                  </p>
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
                      <Clock className="w-3 h-3" />{new Date(order.CreatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={`text-xs ${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border flex items-center gap-1`}>
                    {cfg.icon}
                    <span className="hidden sm:inline">{cfg.label.split(" ")[0]}</span>
                  </Badge>
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