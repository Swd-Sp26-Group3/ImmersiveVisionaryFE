"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { motion } from "framer-motion";
import {
  ArrowLeft, Box, CheckCircle2, CreditCard, Loader2,
  AlertCircle, Lock, ShieldCheck, Zap, Download
} from "lucide-react";

interface Asset {
  AssetId: number;
  AssetName: string;
  Description: string | null;
  Category: string | null;
  Price: number | null;
  PreviewImage: string | null;
  PublishStatus: string | null;
}

// 3 bước tự động theo doc: Order → Payment → Confirm → Download
type CheckoutStep =
  | "review"
  | "creating_order"
  | "creating_payment"
  | "confirming_payment"
  | "done"
  | "error";

const CATEGORY_IMAGES: Record<string, string> = {
  Cosmetics:         "https://images.unsplash.com/photo-1704621354138-e124277356f2?w=600",
  Fashion:           "https://images.unsplash.com/photo-1746730921484-897eff445c9a?w=600",
  "Food & Beverage": "https://images.unsplash.com/photo-1761076879115-97f22dc68755?w=600",
  Electronics:       "https://images.unsplash.com/photo-1670236246338-c619dec5203c?w=600",
  "Home Decor":      "https://images.unsplash.com/photo-1767958465025-75c050ab10c4?w=600",
  default:           "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600",
};

const PROCESSING_STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "creating_order",     label: "Creating order…"     },
  { key: "creating_payment",   label: "Processing payment…" },
  { key: "confirming_payment", label: "Confirming payment…" },
];

export default function CheckoutPage() {
  const searchParams        = useSearchParams();
  const router              = useRouter();
  const { isAuthenticated } = useAuth();

  const assetId = searchParams.get("productId");

  const [asset,     setAsset]     = useState<Asset | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [step,      setStep]      = useState<CheckoutStep>("review");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [mpOrderId, setMpOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?redirect=/marketplace/checkout?productId=${assetId}`);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!assetId) { setLoading(false); return; }
    const cached = sessionStorage.getItem("checkoutProduct");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (String(parsed.AssetId) === assetId) {
          setAsset(parsed);
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }
    }
    apiFetch(`/assets/${assetId}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => setAsset(d.data ?? d))
      .catch(e => setErrorMsg(e.message ?? "Cannot load asset."))
      .finally(() => setLoading(false));
  }, [assetId]);

  // Step 1 — POST /marketplace-orders
  const createOrder = async (): Promise<number> => {
    setStep("creating_order");
    const res  = await apiFetch("/marketplace-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ AssetId: Number(assetId) }),
    });
    const data = await res.json();

    // Đã mua rồi → dùng order cũ
    if (!res.ok && (data.message ?? "").toLowerCase().includes("already purchased")) {
      const myRes  = await apiFetch("/marketplace-orders/my");
      const myData = await myRes.json();
      const orders: any[] = myData.data ?? myData;
      const existing = orders.find(
        (o: any) => o.AssetId === Number(assetId) && o.Status !== "REFUNDED"
      );
      if (existing) { setMpOrderId(existing.MpOrderId); return existing.MpOrderId; }
      router.push("/customer-dashboard");
      throw new Error("__REDIRECT__");
    }

    if (!res.ok) throw new Error(data.message ?? "Failed to create order");
    const order = data.data ?? data;
    const oid   = order.MpOrderId ?? order.id;
    if (!oid) throw new Error("Invalid order response");
    setMpOrderId(oid);
    return oid;
  };

  // Step 2 — POST /payments
  const createPayment = async (): Promise<number | null> => {
    if (!asset?.Price || asset.Price <= 0) return null;
    setStep("creating_payment");
    const res  = await apiFetch("/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        AssetId:     Number(assetId),
        Amount:      asset.Price,
        PaymentType: "ASSET",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Failed to create payment");
    const payment = data.data ?? data;
    return payment.PaymentId ?? payment.paymentId ?? null;
  };

  // Step 3 — POST /payments/confirm  (BR-16: customer confirms immediately)
  const confirmPayment = async (pid: number): Promise<void> => {
    setStep("confirming_payment");
    const res  = await apiFetch("/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: pid }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? "Failed to confirm payment");
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    try {
      const oid = await createOrder();
      const pid = await createPayment();
      if (pid) await confirmPayment(pid);

      setStep("done");
      sessionStorage.removeItem("checkoutProduct");
      setTimeout(() => {
        router.push(
          `/marketplace/order-success?orderId=${oid}` +
          `&productId=${assetId}` +
          `&name=${encodeURIComponent(asset?.AssetName ?? "Asset")}`
        );
      }, 1200);
    } catch (err: any) {
      if (err.message === "__REDIRECT__") return;
      setStep("error");
      setErrorMsg(err.message ?? "Something went wrong.");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    </div>
  );

  if (!assetId || !asset) return (
    <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-red-400">{errorMsg || "No asset selected."}</p>
        <Button onClick={() => router.push("/marketplace")} variant="outline" className="border-slate-700 text-slate-300">
          Back to Marketplace
        </Button>
      </div>
    </div>
  );

  const coverImage   = asset.PreviewImage || CATEGORY_IMAGES[asset.Category ?? "default"] || CATEGORY_IMAGES.default;
  const isProcessing = ["creating_order", "creating_payment", "confirming_payment"].includes(step);
  const curProcIdx   = PROCESSING_STEPS.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-[#080d1a] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-[#080d1a]/90 backdrop-blur border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => router.push(`/marketplace/${assetId}`)}
          disabled={isProcessing}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm disabled:opacity-40 disabled:pointer-events-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5" /> Secure Checkout
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 grid lg:grid-cols-5 gap-10">
        {/* LEFT — Asset card */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden sticky top-24">
            <div className="aspect-video relative overflow-hidden">
              <img src={coverImage} alt={asset.AssetName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a] via-transparent" />
              {asset.Category && (
                <Badge className="absolute top-3 left-3 bg-blue-600/90 text-xs">{asset.Category}</Badge>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs mb-2">
                <Box className="w-3.5 h-3.5" /> 3D/AR Asset
              </div>
              <h2 className="text-white font-semibold text-lg mb-1 leading-snug">{asset.AssetName}</h2>
              {asset.Description && (
                <p className="text-slate-500 text-xs line-clamp-2 mb-4">{asset.Description}</p>
              )}
              <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">License</span>
                  <span className="text-white">Commercial</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Formats</span>
                  <span className="text-white text-xs">GLB, USDZ, FBX, WebAR</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-cyan-400 text-lg">
                    {asset.Price != null ? `$${asset.Price.toLocaleString()}` : "Free"}
                  </span>
                </div>
              </div>
              {mpOrderId && (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-500 flex justify-between">
                  <span>Order ID</span>
                  <span className="text-white font-mono">#{mpOrderId}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Payment panel */}
        <div className="lg:col-span-3 flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-3xl font-bold text-white mb-2">Checkout</h1>
            <p className="text-slate-400 mb-8 text-sm">
              Complete your purchase — asset available for download immediately
            </p>

            {/* Step tracker */}
            <div className="flex items-center gap-2 mb-8">
              {[
                { key: "creating_order",     label: "Order"   },
                { key: "creating_payment",   label: "Payment" },
                { key: "confirming_payment", label: "Confirm" },
                { key: "done",               label: "Done"    },
              ].map((s, i, arr) => {
                const ORDER = ["review","creating_order","creating_payment","confirming_payment","done","error"];
                const curI  = ORDER.indexOf(step);
                const sI    = ORDER.indexOf(s.key);
                const active   = step === s.key;
                const complete = curI > sI && step !== "error";
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      complete ? "bg-cyan-500 text-white" :
                      active   ? "bg-white text-black ring-2 ring-cyan-400/40" :
                                 "bg-white/10 text-slate-500"
                    }`}>
                      {complete ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs ${active ? "text-white font-medium" : "text-slate-500"}`}>{s.label}</span>
                    {i < arr.length - 1 && <div className="w-5 h-px bg-white/15 mx-1" />}
                  </div>
                );
              })}
            </div>

            {/* Review */}
            {step === "review" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: ShieldCheck, text: "Secure payment" },
                    { icon: Zap,         text: "Instant access" },
                    { icon: Download,    text: "Download now"   },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="rounded-xl bg-white/5 border border-white/8 p-3 text-center">
                      <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-400">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3 text-sm">
                  <p className="text-white font-semibold">Order Summary</p>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span>Asset</span>
                      <span className="text-white font-medium truncate max-w-[60%] text-right">{asset.AssetName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Asset ID</span>
                      <span className="text-white font-mono">#{asset.AssetId}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10 font-semibold">
                      <span className="text-white">Amount</span>
                      <span className="text-cyan-400 text-base">
                        {asset.Price != null ? `$${asset.Price.toLocaleString()}` : "Free"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4 text-xs text-slate-300 space-y-1">
                  <p className="text-green-400 font-semibold mb-1.5 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> After purchase
                  </p>
                  <p>✓ Payment confirmed instantly</p>
                  <p>✓ Asset available in <strong className="text-white">My Purchases</strong> immediately</p>
                  <p>✓ Download GLB, USDZ, FBX, WebAR formats</p>
                  <p>✓ Commercial license included</p>
                </div>

                <Button
                  onClick={handleSubmit}
                  className="w-full py-6 text-base bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay {asset.Price != null ? `$${asset.Price.toLocaleString()}` : ""} & Download
                </Button>
              </motion.div>
            )}

            {/* Processing */}
            {isProcessing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 space-y-5">
                <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg mb-1">
                    {PROCESSING_STEPS[curProcIdx]?.label ?? "Processing…"}
                  </p>
                  <p className="text-slate-400 text-sm">Please don't close this page</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {PROCESSING_STEPS.map((s, i) => (
                    <div key={s.key} className={`h-1.5 rounded-full transition-all duration-500 ${
                      i < curProcIdx  ? "w-3 bg-cyan-700" :
                      i === curProcIdx ? "w-6 bg-cyan-400" :
                                        "w-3 bg-white/15"
                    }`} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Done */}
            {step === "done" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-white font-bold text-xl">Payment Confirmed!</p>
                <p className="text-slate-400 text-sm">Redirecting to your download page…</p>
              </motion.div>
            )}

            {/* Error */}
            {step === "error" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-medium text-sm mb-0.5">Payment failed</p>
                    <p className="text-red-300/70 text-xs">{errorMsg}</p>
                  </div>
                </div>
                <Button
                  onClick={() => { setStep("review"); setErrorMsg(""); setMpOrderId(null); }}
                  variant="outline" className="w-full border-slate-700 text-slate-300 hover:text-white"
                >
                  Try Again
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}