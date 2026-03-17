"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { motion } from "motion/react";
import {
  CheckCircle2, Package, Clock, ArrowRight,
  Loader2, AlertCircle, Home, Plus
} from "lucide-react";
import Link from "next/link";

// ── Types matching BE CreativeOrderDetail ──
interface OrderDetail {
  OrderId: number;
  CompanyId: number;
  ProjectName: string | null;
  ProductType: string | null;
  Budget: string | null;
  DeliverySpeed: string | null;
  TargetPlatform: string | null;
  Brief: string | null;
  Status: string;
  CreatedAt: string;
  CompanyName: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NEW:           { label: "New",           color: "bg-yellow-600" },
  IN_PRODUCTION: { label: "In Production", color: "bg-blue-600"   },
  REVIEW:        { label: "Under Review",  color: "bg-purple-600" },
  COMPLETED:     { label: "Completed",     color: "bg-green-600"  },
  DELIVERED:     { label: "Delivered",     color: "bg-cyan-600"   },
  CANCELLED:     { label: "Cancelled",     color: "bg-red-600"    },
};

const NEXT_STEPS = [
  { label: "Order Created",       description: "Your order has been received",  done: true  },
  { label: "Manager Review",      description: "Manager assigns an artist",    done: false },
  { label: "3D/AR Production",    description: "Artist creates your assets",   done: false },
  { label: "Client Review",       description: "Review and approve the result", done: false },
  { label: "Delivery",            description: "Download your final assets",   done: false },
];

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided.");
      setLoading(false);
      return;
    }

    apiFetch(`/orders/${orderId}`)
      .then(r => { if (!r.ok) throw new Error(`Order not found (${r.status})`); return r.json(); })
      .then(d => setOrder(d.data ?? d))
      .catch(e => setError(e.message ?? "Failed to load order details."))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] flex items-center justify-center px-4">
        <Card className="bg-[#1a1f3a]/50 border-red-500/30 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Order Not Found</p>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <Link href="/order">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Place New Order
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "bg-gray-600" };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Order Submitted!</h1>
          <p className="text-gray-400">Your custom production order has been created successfully</p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur mb-6">
            <CardHeader className="border-b border-white/8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  Order #{order.OrderId}
                </CardTitle>
                <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Project Name", value: order.ProjectName ?? "Custom Project" },
                  { label: "Category",     value: order.ProductType ?? "Not specified" },
                  { label: "Budget",       value: order.Budget ?? "Not specified" },
                  { label: "Speed",        value: order.DeliverySpeed ?? "Standard" },
                  { label: "Company",      value: order.CompanyName ?? `#${order.CompanyId}` },
                  { label: "Created",      value: new Date(order.CreatedAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-900/40 rounded-lg p-3 border border-white/6">
                    <p className="text-slate-500 text-xs mb-1">{label}</p>
                    <p className="text-white font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {order.Brief && (
                <div className="mt-4 bg-blue-500/5 border border-blue-500/15 rounded-lg p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Project Brief</p>
                  <p className="text-white text-sm leading-relaxed">{order.Brief}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* What Happens Next */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-[#1a1f3a]/50 border-purple-500/20 backdrop-blur mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                What Happens Next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-[9px] top-3 bottom-3 w-px bg-white/8" />
                <div className="space-y-4">
                  {NEXT_STEPS.map((step, i) => (
                    <div key={step.label} className="flex items-start gap-3 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        step.done ? "bg-green-500" : "bg-white/10"
                      }`}>
                        {step.done && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {!step.done && <div className="w-2 h-2 rounded-full bg-slate-600" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${step.done ? "text-white" : "text-slate-500"}`}>{step.label}</p>
                        <p className={`text-xs ${step.done ? "text-slate-400" : "text-slate-600"}`}>{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3">
          <Link href="/customer-dashboard" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Home className="w-4 h-4 mr-2" />
              View My Orders
            </Button>
          </Link>
          <Link href="/order" className="flex-1">
            <Button variant="outline" className="w-full border-purple-500/30 text-white hover:bg-white/5">
              <Plus className="w-4 h-4 mr-2" />
              Place Another Order
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0f1729] via-[#1a1f3a] to-[#0f1729] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
