"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Download, LayoutDashboard, ShoppingBag } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { motion } from "framer-motion";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Đọc thông tin từ query params (truyền từ checkout)
  const productName = searchParams.get("name") ?? "Your Product";
  const productId = searchParams.get("productId");

  // Khi BE có delivery endpoint:
  // const handleDownload = async () => {
  //   const res = await apiFetch(`/deliveries?productId=${productId}`)
  //   const data = await res.json()
  //   window.open(data.downloadUrl, "_blank")
  // }

  const handleDownload = () => {
    // Mock — thay bằng API thật khi BE sẵn sàng
    alert("Download sẽ có sau khi team xử lý đơn hàng của bạn.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#0a1120] flex items-center justify-center text-white px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="bg-slate-800/60 border-blue-500/20 backdrop-blur text-center overflow-hidden">
          {/* Top accent line */}
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600" />

          <CardContent className="pt-10 pb-10 px-8 flex flex-col items-center gap-6">
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </motion.div>

            {/* Text */}
            <div>
              <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your request for{" "}
                <span className="text-cyan-400 font-medium">{decodeURIComponent(productName)}</span>{" "}
                has been received. Our team will contact you within 24 hours.
              </p>
            </div>

            {/* Order ID */}
            {productId && (
              <div className="bg-slate-900/60 rounded-lg px-4 py-3 border border-slate-700 w-full">
                <p className="text-xs text-slate-500 mb-1">Product Reference</p>
                <p className="text-white font-mono text-sm">#{productId}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Files
              </Button>

              <Button
                onClick={() => router.push("/customer-dashboard")}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                onClick={() => router.push("/marketplace")}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}