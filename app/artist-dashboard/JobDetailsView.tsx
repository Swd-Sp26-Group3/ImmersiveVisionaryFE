"use client";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Send, Upload, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CreativeOrder, ORDER_STATUS_CONFIG, PRODUCTION_STAGES } from "./types";

interface Props {
  order: CreativeOrder;
  onBack: () => void;
}

export function JobDetailView({ order, onBack }: Props) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.Status);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true); setMessage(null);
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: status }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Update failed");
      setCurrentStatus(status as CreativeOrder["Status"]);
      setMessage({ type: "success", text: `Status updated to "${ORDER_STATUS_CONFIG[status]?.label}"!` });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message ?? "Update failed." });
    } finally { setUpdating(false); }
  };

  const cfg = ORDER_STATUS_CONFIG[currentStatus] ?? ORDER_STATUS_CONFIG.NEW;
  const stageIdx = PRODUCTION_STAGES.findIndex(s => s.key === currentStatus);

  return (
    <div className="space-y-5">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white transition text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Tasks
      </button>

      <div className="bg-[#0d1526] border border-white/8 rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
        <div className="p-6">

          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-white text-xl font-bold mb-2">
                {order.ProductName ?? `Order #${order.OrderId}`}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-slate-500 text-sm">#{order.OrderId}</span>
                {order.CompanyName && <span className="text-slate-500 text-sm">· {order.CompanyName}</span>}
              </div>
            </div>

            <div className="flex gap-2">
              {currentStatus === "IN_PRODUCTION" && (
                <Button onClick={() => handleUpdateStatus("REVIEW")} disabled={updating}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-xl">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  Submit for Review
                </Button>
              )}
              {currentStatus === "COMPLETED" && (
                <Button onClick={() => handleUpdateStatus("DELIVERED")} disabled={updating}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-xl">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  Mark Delivered
                </Button>
              )}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-4 flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 border ${
              message.type === "success"
                ? "text-green-400 bg-green-500/10 border-green-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20"
            }`}>
              {message.type === "success"
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Order ID",  value: `#${order.OrderId}` },
              { label: "Company",   value: order.CompanyName ?? "—" },
              { label: "Package",   value: order.PackageName  ?? "—" },
              { label: "Platform",  value: order.TargetPlatform ?? "Not specified" },
              { label: "Deadline",  value: order.Deadline ? new Date(order.Deadline).toLocaleDateString() : "No deadline" },
              { label: "Created",   value: new Date(order.CreatedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/40 border border-white/6 rounded-xl p-3">
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Brief */}
          {order.Brief && (
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-6">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Customer Brief</p>
              <p className="text-white text-sm leading-relaxed">{order.Brief}</p>
            </div>
          )}

          {/* Production tracker */}
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">Production Progress</p>
            <div className="relative">
              <div className="absolute left-[9px] top-3 bottom-3 w-px bg-white/8" />
              <div className="space-y-3">
                {PRODUCTION_STAGES.map((s, i) => {
                  const done    = i < stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div key={s.key} className="flex items-center gap-3 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        done    ? "bg-cyan-500 shadow-sm shadow-cyan-500/50" :
                        current ? "bg-white ring-2 ring-cyan-500/40" :
                                  "bg-white/10"
                      }`}>
                        {done    && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {current && <div className="w-2 h-2 rounded-full bg-[#0d1526]" />}
                      </div>
                      <span className={`text-sm font-medium ${
                        current ? "text-white" : done ? "text-slate-400" : "text-slate-700"
                      }`}>{s.label}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}