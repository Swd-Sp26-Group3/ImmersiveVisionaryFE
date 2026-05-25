'use client';
import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, XCircle, Search, Download, RefreshCw, Terminal } from "lucide-react";
import { FilterPills } from "@/app/components/ui/filter-pills";
import { motion, AnimatePresence } from "motion/react";

interface LogEntry {
  id: string;
  type: "Info" | "Warning" | "Error";
  message: string;
  timestamp: string;
  source?: string;
}

const LOG_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  Info:    { border: "border-sky-500/20",   text: "text-sky-400",   bg: "bg-sky-500/5"   },
  Warning: { border: "border-yellow-500/20", text: "text-yellow-400", bg: "bg-yellow-500/5" },
  Error:   { border: "border-rose-500/20",    text: "text-rose-400",    bg: "bg-rose-500/5"    },
};

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
  if (type === "Error")   return <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />;
  if (type === "Warning") return <AlertTriangle className="w-4.5 h-4.5 text-yellow-400 shrink-0 mt-0.5" />;
  return <CheckCircle className="w-4.5 h-4.5 text-sky-400 shrink-0 mt-0.5" />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <Terminal className="w-6 h-6 text-indigo-400" /> Audit Log Trail
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time recording of transactional, user and diagnostic system operations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Static Data Simulation
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-white/[0.08] hover:border-indigo-500/30 text-slate-300 hover:text-indigo-400 rounded-xl text-xs font-bold bg-[#0d1324]/50 transition-all cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" /> Export CSV
          </motion.button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["Error", "Warning", "Info"] as const).map((type, idx) => {
          const cfg = LOG_COLORS[type];
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className={`rounded-2xl border p-5 ${cfg.border} ${cfg.bg} cursor-pointer shadow-md transition-all flex flex-col justify-between`}
              onClick={() => setFilter(filter === type ? "All" : type)}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{type} logs</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className={`text-3xl font-extrabold ${cfg.text} mt-4 tracking-tight`}>{counts[type]}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col lg:flex-row gap-4 pt-2">
        <FilterPills
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
          counts={pillCounts}
          activeClass="bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/10"
        />
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            placeholder="Search by message or source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0d1324]/50 border border-white/[0.06] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Log list */}
      <div className="max-h-[440px] overflow-y-auto pr-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-[#0d1324]/20 border border-dashed border-white/[0.06] rounded-2xl">
            <Search className="w-9 h-9 mx-auto mb-3 opacity-30 animate-pulse" />
            <p className="text-sm font-medium">No system log entries found matching criteria</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filtered.map((log) => {
              const cfg = LOG_COLORS[log.type];
              return (
                <motion.div
                  key={log.id}
                  variants={itemVariants}
                  whileHover={{ y: -0.5 }}
                  className={`flex items-start gap-4 p-4.5 rounded-2xl bg-[#0d1324]/40 border ${cfg.border} hover:bg-[#0d1324]/60 transition-all`}
                >
                  <LogIcon type={log.type} />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {log.source && (
                        <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          {log.source.toUpperCase()}
                        </span>
                      )}
                      <p className="text-slate-100 text-sm font-semibold tracking-wide leading-relaxed">{log.message}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono font-medium">{log.timestamp}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.border} ${cfg.text} ${cfg.bg}`}>
                    {log.type.toUpperCase()}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <p className="text-center text-[10px] text-slate-600 font-semibold pt-4">
        Showing {filtered.length} of {STATIC_LOGS.length} log entries
      </p>
    </div>
  );
}