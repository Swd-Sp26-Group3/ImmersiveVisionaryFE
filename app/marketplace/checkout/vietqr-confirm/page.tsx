"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

function VietQRConfirmContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying payment...");
    const [mpOrderId, setMpOrderId] = useState<number | null>(null);

    useEffect(() => {
        let isCancelled = false;
        let intervalId: NodeJS.Timeout;

        const verifyPayment = async () => {
            try {
                const paymentIdStr = searchParams.get("paymentId");
                if (!paymentIdStr) {
                    setStatus("error");
                    setMessage("No payment ID provided.");
                    return;
                }
                const paymentId = parseInt(paymentIdStr);

                // 1. Get the Payment status
                const payRes = await apiFetch(`/payments/${paymentId}`);
                if (!payRes.ok) {
                    setStatus("error");
                    setMessage("Could not retrieve payment information.");
                    return;
                }
                const payData = await payRes.json();
                const payment = payData.data ?? payData;

                if (payment.PaymentStatus === "PAID") {
                    if (isCancelled) return;
                    setStatus("success");
                    setMessage("Payment was verified successfully!");
                    if (intervalId) clearInterval(intervalId);

                    const assetId = payment.AssetId;
                    if (assetId) {
                        // Find the MarketplaceOrder associated with this AssetId
                        const orderRes = await apiFetch("/marketplace-orders/my");
                        if (orderRes.ok) {
                            const orderData = await orderRes.json();
                            const orders: any[] = orderData.data ?? orderData;
                            const matchingOrder = orders.find(
                                (o: any) => o.AssetId === assetId && (o.Status === "PAID" || o.Status === "DELIVERED")
                            );
                            if (matchingOrder && !isCancelled) {
                                setMpOrderId(matchingOrder.MpOrderId);
                            }
                        }
                    }
                } else {
                    if (isCancelled) return;
                    setStatus("loading");
                    setMessage("Payment is still pending. We are waiting for banking notification.");
                }

            } catch (err: any) {
                console.error("VietQR Confirm Processing Error:", err);
                if (!isCancelled) {
                    setStatus("error");
                    setMessage(err.message ?? "An error occurred while confirming your payment.");
                    if (intervalId) clearInterval(intervalId);
                }
            }
        };

        // Initial run
        verifyPayment();

        // Start polling
        intervalId = setInterval(verifyPayment, 4000);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [searchParams]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#080d1a] flex flex-col items-center justify-center text-white p-6">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                <h1 className="text-xl font-bold mb-2">Verifying Transaction</h1>
                <p className="text-slate-400 text-center max-w-xs">Please wait while we confirm your payment status.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#080d1a] text-white flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur"
            >
                {status === "success" ? (
                    <>
                        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <Button
                            onClick={() => router.push(mpOrderId ? `/marketplace/order-success?orderId=${mpOrderId}` : "/customer-dashboard?tab=purchases")}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-semibold py-6 rounded-xl shadow-lg shadow-cyan-500/20 transition-all font-bold"
                        >
                            Finish Purchase
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Payment Verification Error</h1>
                        <p className="text-red-400/80 mb-8 text-sm">{message}</p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push("/marketplace")}
                                className="w-full bg-white text-black hover:bg-slate-200 font-semibold py-4 rounded-xl"
                            >
                                Back to Marketplace
                            </Button>
                            <Button
                                onClick={() => router.push("/customer-dashboard?tab=purchases")}
                                variant="outline"
                                className="w-full border-white/10 text-slate-400 hover:text-white py-4 rounded-xl"
                            >
                                View My Purchases
                            </Button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default function VietQRConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        }>
            <VietQRConfirmContent />
        </Suspense>
    );
}
