"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { CreditCard, Lock } from "lucide-react";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemId = searchParams.get("itemId");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    // TODO: gọi API payment thật
    setTimeout(() => {
      router.push(`/order-success?itemId=${itemId}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] py-16 text-white">
      <div className="max-w-lg mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div
          className="rounded-2xl p-8 flex flex-col gap-6"
          style={{ background: "rgba(20,25,55,0.85)", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Secure Payment</span>
          </div>

          <div className="flex flex-col gap-4">
            <Input placeholder="Card Number" className="bg-slate-900 border-slate-700 text-white" />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="MM/YY" className="bg-slate-900 border-slate-700 text-white" />
              <Input placeholder="CVV" className="bg-slate-900 border-slate-700 text-white" />
            </div>
            <Input placeholder="Cardholder Name" className="bg-slate-900 border-slate-700 text-white" />
          </div>

          <Button
            onClick={handlePay}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 h-12 text-base font-semibold"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {isProcessing ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </div>
    </div>
  );
}