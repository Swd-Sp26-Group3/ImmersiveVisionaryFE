"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { motion } from "framer-motion";
import {
  CheckCircle2, LayoutDashboard, ShoppingBag,
  Loader2, Box, Clock, Download
} from "lucide-react";

// MarketplaceOrder schema từ DB
interface MarketplaceOrder {
  MpOrderId: number;
  AssetId: number;
  BuyerCompanyId: number;
  SellerCompanyId: number;
  Price: number | null;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  CreatedAt: string;
  AssetName?: string | null;      // nếu BE join
  BuyerCompanyName?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:   { label: "Pending",   color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  PAID:      { label: "Paid",      color: "bg-green-500/20 text-green-300 border-green-500/30"   },
  DELIVERED: { label: "Delivered", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"      },
  REFUNDED:  { label: "Refunded",  color: "bg-red-500/20 text-red-300 border-red-500/30"         },
};

// Marketplace order progress (khác với CreativeOrder)
const ORDER_STEPS = [
  { key: "PENDING",   label: "Order Placed"  },
  { key: "PAID",      label: "Payment Done"  },
  { key: "DELIVERED", label: "Delivered"     },
];

export default function MarketplaceOrderSuccessPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const orderId   = searchParams.get("orderId");    // MpOrderId
  const productId = searchParams.get("productId");  // AssetId
  const assetName = decodeURIComponent(searchParams.get("name") ?? "Your Asset");

  const [order, setOrder]     = useState<MarketplaceOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // GET /api/marketplace-orders/:id — đúng table MarketplaceOrder
  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    apiFetch(`/marketplace-orders/${orderId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setOrder(d.data ?? d))
      .catch(() => {/* non-critical — vẫn hiển thị success UI */})
      .finally(() => setLoading(false));
  }, [orderId]);

  const currentStepIdx = ORDER_STEPS.findIndex(s => s.key === (order?.Status ?? "PENDING"));
  const statusCfg = STATUS_CONFIG[order?.Status ?? "PENDING"];

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

            {/* Icon */}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                You have purchased{" "}
                <span className="text-cyan-400 font-semibold">
                  {order?.AssetName ?? assetName}
                </span>
                . The asset will be available in your dashboard shortly.
              </p>
            </motion.div>

            {/* Order details */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Box className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-medium text-sm">{order?.AssetName ?? assetName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {orderId && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Order ID</p>
                    <p className="text-white font-mono">#{orderId}</p>
                  </div>
                )}
                {order?.Status && (
                  <div>
                    <p className="text-slate-500 mb-0.5">Status</p>
                    <Badge className={`text-xs border ${statusCfg.color}`}>
                      {statusCfg.label}
                    </Badge>
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
                    <p className="text-slate-500 mb-0.5">Amount</p>
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

            {/* Order progress */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-6"
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Order Progress</p>
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading status…
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-[13px] top-3 bottom-3 w-px bg-white/10" />
                  <div className="space-y-3">
                    {ORDER_STEPS.map((s, i) => {
                      const done    = i < currentStepIdx;
                      const current = i === currentStepIdx;
                      const future  = i > currentStepIdx;
                      return (
                        <div key={s.key} className="flex items-center gap-3 relative z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                            done    ? "bg-cyan-500 text-white" :
                            current ? "bg-white text-black ring-2 ring-cyan-500/40" :
                                      "bg-white/10 text-slate-600"
                          }`}>
                            {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                          </div>
                          <span className={`text-sm ${current ? "text-white font-semibold" : future ? "text-slate-600" : "text-slate-300"}`}>
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
              )}
            </motion.div>

            {/* What's next */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-blue-400" />
                <p className="text-white text-sm font-medium">Access your asset</p>
              </div>
              <ul className="space-y-1 text-xs text-slate-400 ml-6">
                <li>• Asset available in your dashboard under "My Purchases"</li>
                <li>• Download GLB, USDZ, FBX or WebAR formats</li>
                <li>• Commercial license included with purchase</li>
                <li>• Contact support if delivery takes more than 24h</li>
              </ul>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-2"
            >
              <Button
                onClick={() => router.push("/customer-dashboard")}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold rounded-xl"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to My Dashboard
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
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