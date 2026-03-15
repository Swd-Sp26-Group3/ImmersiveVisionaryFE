"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { motion } from "framer-motion";
import {
  CheckCircle2, LayoutDashboard, ShoppingBag,
  Loader2, Box, Download, ExternalLink, AlertCircle
} from "lucide-react";

interface MarketplaceOrder {
  MpOrderId: number;
  AssetId: number;
  Price: number | null;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  CreatedAt: string;
  AssetName?: string | null;
}

interface AssetVersion {
  VersionId: number;
  FileFormat: "GLB" | "USDZ" | "FBX" | "WEBAR";
  FileUrl: string | null;
}

const FORMAT_COLOR: Record<string, string> = {
  GLB:   "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  USDZ:  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  FBX:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  WEBAR: "bg-green-500/20 text-green-300 border-green-500/30",
};

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const orderId   = searchParams.get("orderId");
  const productId = searchParams.get("productId");
  const assetName = decodeURIComponent(searchParams.get("name") ?? "Your Asset");

  const [order,    setOrder]    = useState<MarketplaceOrder | null>(null);
  const [versions, setVersions] = useState<AssetVersion[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }

    // Load order + asset versions in parallel
    Promise.all([
      apiFetch(`/marketplace-orders/${orderId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => d ? (d.data ?? d) : null),
      productId
        ? apiFetch(`/asset-versions/${productId}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => d ? (d.data ?? d) : [])
        : Promise.resolve([]),
    ])
      .then(([ord, vers]) => {
        if (ord) setOrder(ord);
        if (Array.isArray(vers)) setVersions(vers);
      })
      .catch(() => {/* non-critical */})
      .finally(() => setLoading(false));
  }, [orderId, productId]);

  // Download một version cụ thể
  const handleDownload = async (versionId: number, format: string) => {
    try {
      const res  = await apiFetch(`/asset-versions/${versionId}/download`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const url = data.data?.downloadUrl ?? data.downloadUrl;
      if (url) window.open(url, "_blank");
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  // Kiểm tra order đã paid chưa (PAID = customer confirmed payment)
  const isPaid = order?.Status === "PAID" || order?.Status === "DELIVERED";

  return (
    <div className="min-h-screen bg-[#080d1a] text-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

          <div className="p-8">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 12 }}
              className="w-20 h-20 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                You have purchased{" "}
                <span className="text-cyan-400 font-semibold">{order?.AssetName ?? assetName}</span>.
                {" "}Payment confirmed — download is available now.
              </p>
            </motion.div>

            {/* Order details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Box className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-medium text-sm">{order?.AssetName ?? assetName}</span>
                {order?.Status && (
                  <Badge className={`ml-auto text-xs border ${
                    order.Status === "PAID" || order.Status === "DELIVERED"
                      ? "bg-green-500/20 text-green-300 border-green-500/30"
                      : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                  }`}>
                    {order.Status === "PAID" ? "Paid ✓" : order.Status}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {orderId && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Order ID</p>
                    <p className="text-white font-mono">#{orderId}</p>
                  </div>
                )}
                {productId && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Asset ID</p>
                    <p className="text-white font-mono">#{productId}</p>
                  </div>
                )}
                {order?.Price != null && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Amount Paid</p>
                    <p className="text-cyan-400 font-semibold">${order.Price.toLocaleString()}</p>
                  </div>
                )}
                {order?.CreatedAt && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Purchased</p>
                    <p className="text-white">{new Date(order.CreatedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Download Section (Screen #8 theo doc) ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" /> Download Your Asset
              </p>

              {loading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading download links…
                </div>
              ) : !isPaid ? (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 flex gap-2 text-xs text-yellow-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Payment is still being processed. Please refresh in a moment.
                </div>
              ) : versions.length === 0 ? (
                <div className="rounded-xl bg-slate-800/60 border border-white/8 p-4 text-center">
                  <p className="text-slate-400 text-sm">No download files available yet.</p>
                  <p className="text-slate-600 text-xs mt-1">Check back in My Purchases.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div
                      key={v.VersionId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/8 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`text-xs border ${FORMAT_COLOR[v.FileFormat] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}>
                          {v.FileFormat}
                        </Badge>
                        <span className="text-slate-400 text-xs">Version #{v.VersionId}</span>
                      </div>
                      {v.FileUrl ? (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(v.VersionId, v.FileFormat)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs px-3"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                      ) : (
                        <span className="text-slate-600 text-xs">Not available</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <Button
                onClick={() => router.push("/customer-dashboard?tab=purchases")}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold rounded-xl"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to My Purchases
              </Button>
              <Button
                onClick={() => router.push("/marketplace")}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:text-white rounded-xl"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-center text-xs text-slate-600 mt-6"
        >
          Questions?{" "}
          <button className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">
            Contact support
          </button>
        </motion.p>
      </div>
    </div>
  );
}