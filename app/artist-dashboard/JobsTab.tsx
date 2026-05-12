"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { StatusBadge } from "@/app/components/ui/status-badge";
import { FilterPills } from "@/app/components/ui/filter-pills";
import { RefreshCw, Package, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CreativeOrder, ORDER_STATUS_CONFIG, CATEGORY_IMAGES } from "./types";
import { JobDetailView } from "./JobDetailsView";

interface Props {
  initialOrders?: CreativeOrder[];
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL",         label: "All"         },
  { value: "NEW",         label: "New"         },
  { value: "IN_PRODUCTION", label: "In Production" },
  { value: "REVIEW",      label: "Review"      },
  { value: "COMPLETED",   label: "Completed"   },
  { value: "DELIVERED",   label: "Delivered"   },
];

export function JobsTab({ initialOrders }: Props) {
  const [orders, setOrders]     = useState<CreativeOrder[]>(initialOrders ?? []);
  const [loading, setLoading]   = useState(!initialOrders);
  const [error, setError]       = useState("");
  const [selected, setSelected] = useState<CreativeOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const fetchOrders = () => {
    setLoading(true);
    setError("");
    apiFetch("/orders/my")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setOrders(d.data ?? d))
      .catch((e) => setError(`Cannot load tasks. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (!initialOrders) fetchOrders(); }, []);

  if (selected) {
    return <JobDetailView order={selected} onBack={() => setSelected(null)} />;
  }

  const filtered = filterStatus === "ALL" ? orders : orders.filter((o) => o.Status === filterStatus);
  const newCount = orders.filter((o) => o.Status === "NEW").length;

  const counts = STATUS_FILTER_OPTIONS.reduce((acc, opt) => {
    if (opt.value !== "ALL") acc[opt.value] = orders.filter((o) => o.Status === opt.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-[var(--surface-2)] border border-white/[0.08] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-400" />
            Assigned Custom Projects
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Orders assigned to you by manager</p>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full px-2.5 py-1">
              {newCount} new
            </span>
          )}
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="px-5 py-3 border-b border-white/[0.05]">
        <FilterPills
          options={STATUS_FILTER_OPTIONS}
          value={filterStatus}
          onChange={setFilterStatus}
          counts={counts}
          activeClass="bg-blue-600 border-blue-600 text-white"
        />
      </div>

      {/* List */}
      <div className="p-5">
        {loading ? (
          <LoadingSpinner size="md" color="cyan" fullPage />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchOrders} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="No tasks found." />
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => {
              const cfg = ORDER_STATUS_CONFIG[order.Status] ?? ORDER_STATUS_CONFIG.NEW;
              return (
                <div
                  key={order.OrderId}
                  onClick={() => setSelected(order)}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-white/[0.06] hover:border-cyan-500/20 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                    <img
                      src={CATEGORY_IMAGES.default}
                      alt=""
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {order.ProductName ?? `Order #${order.OrderId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>#{order.OrderId}</span>
                      {order.CompanyName && <><span>·</span><span>{order.CompanyName}</span></>}
                      {order.Deadline && (
                        <><span>·</span>
                          <span className="text-yellow-400">
                            Due {new Date(order.Deadline).toLocaleDateString()}
                          </span></>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={order.Status} config={ORDER_STATUS_CONFIG} />
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}