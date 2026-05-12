'use client';
import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, XCircle, Search, Download, RefreshCw, Terminal } from "lucide-react";
import { FilterPills } from "@/app/components/ui/filter-pills";

interface LogEntry {
  id: string;
  type: "Info" | "Warning" | "Error";
  message: string;
  timestamp: string;
  source?: string;
}

const LOG_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  Info:    { border: "border-blue-500/20",   text: "text-blue-400",   bg: "bg-blue-500/10"   },
  Warning: { border: "border-yellow-500/20", text: "text-yellow-400", bg: "bg-yellow-500/10" },
  Error:   { border: "border-red-500/20",    text: "text-red-400",    bg: "bg-red-500/10"    },
};

// ── Static logs (BE /admin/logs endpoint not yet implemented) ──────────────────
const STATIC_LOGS: LogEntry[] = [
  { id: "L001", type: "Info",    source: "Auth",     message: "User john@example.com logged in successfully",      timestamp: "2026-03-09 10:23:45" },
  { id: "L002", type: "Warning", source: "System",   message: "High server load detected (85%)",                   timestamp: "2026-03-09 09:15:22" },
  { id: "L003", type: "Error",   source: "Upload",   message: "Failed upload attempt from USR-005 — file too large",timestamp: "2026-03-09 08:45:10" },
  { id: "L004", type: "Info",    source: "Auth",     message: "New user registered: kayne_wall456",                timestamp: "2026-03-09 07:30:00" },
  { id: "L005", type: "Warning", source: "Auth",     message: "Refresh token expired for USR-002",                 timestamp: "2026-03-08 23:10:05" },
  { id: "L006", type: "Error",   source: "Database", message: "Database connection timeout after 30s",             timestamp: "2026-03-08 21:05:33" },
  { id: "L007", type: "Info",    source: "Payments", message: "VNPay payment confirmed for order #MO-421",         timestamp: "2026-03-08 19:50:12" },
  { id: "L008", type: "Warning", source: "Assets",   message: "Asset Base64Data exceeds recommended size (12 MB)", timestamp: "2026-03-08 18:30:00" },
  { id: "L009", type: "Info",    source: "Orders",   message: "Order #ORD-108 status changed: IN_PRODUCTION",      timestamp: "2026-03-08 17:00:40" },
  { id: "L010", type: "Error",   source: "System",   message: "Unhandled exception in marketplaceOrderService",    timestamp: "2026-03-08 15:22:11" },
];

const FILTER_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Info", label: "Info" },
  { value: "Warning", label: "Warning" },
  { value: "Error", label: "Error" },
];

const LogIcon = ({ type }: { type: string }) => {
  if (type === "Error")   return <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />;
  if (type === "Warning") return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />;
  return <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />;
};

export default function LogsPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => STATIC_LOGS.filter((log) => {
    const matchType = filter === "All" || log.type === filter;
    const matchSearch = !search ||
      log.message.toLowerCase().includes(search.toLowerCase()) ||
      (log.source?.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchType && matchSearch;
  }), [filter, search]);

  const counts = useMemo(() => ({
    Error:   STATIC_LOGS.filter((l) => l.type === "Error").length,
    Warning: STATIC_LOGS.filter((l) => l.type === "Warning").length,
    Info:    STATIC_LOGS.filter((l) => l.type === "Info").length,
  }), []);

  const pillCounts = { Info: counts.Info, Warning: counts.Warning, Error: counts.Error };

  const handleExport = () => {
    const csv = [
      "ID,Type,Source,Message,Timestamp",
      ...filtered.map((l) => `${l.id},${l.type},${l.source ?? ""},\"${l.message}\",${l.timestamp}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" /> System Logs
          </h1>
          <p className="text-gray-400 text-sm mt-1">Monitor system events and errors</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Static data — live API pending
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/10 text-sm transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {(["Error", "Warning", "Info"] as const).map((type) => {
          const cfg = LOG_COLORS[type];
          return (
            <div
              key={type}
              className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg} cursor-pointer hover:opacity-80 transition`}
              onClick={() => setFilter(filter === type ? "All" : type)}
            >
              <p className={`text-2xl font-bold ${cfg.text}`}>{counts[type]}</p>
              <p className="text-slate-400 text-xs mt-0.5">{type} events</p>
            </div>
          );
        })}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <FilterPills
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          counts={pillCounts}
          activeClass="bg-blue-600 border-blue-600 text-white"
        />
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Search by message or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/60 border border-blue-500/20 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition"
          />
        </div>
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No logs match your filter.
          </div>
        ) : filtered.map((log) => {
          const cfg = LOG_COLORS[log.type];
          return (
            <div
              key={log.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/60 border ${cfg.border} hover:bg-slate-900/80 transition`}
            >
              <LogIcon type={log.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  {log.source && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                      {log.source}
                    </span>
                  )}
                  <p className="text-white text-sm">{log.message}</p>
                </div>
                <p className="text-xs text-gray-500 font-mono">{log.timestamp}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${cfg.border} ${cfg.text} ${cfg.bg}`}>
                {log.type}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-slate-700 pt-2">
        Showing {filtered.length} of {STATIC_LOGS.length} log entries
      </p>
    </div>
  );
}