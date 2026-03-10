'use client';
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";

interface LogEntry {
  id: string;
  type: "Info" | "Warning" | "Error";
  message: string;
  timestamp: string;
}

const LOG_COLORS = {
  Info:    { border: "border-blue-500/20",   text: "text-blue-400",   bg: "bg-blue-500/10"   },
  Warning: { border: "border-yellow-500/20", text: "text-yellow-400", bg: "bg-yellow-500/10" },
  Error:   { border: "border-red-500/20",    text: "text-red-400",    bg: "bg-red-500/10"    },
};

const LogIcon = ({ type }: { type: string }) => {
  if (type === "Error")   return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  if (type === "Warning") return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
  return <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Info" | "Warning" | "Error">("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch("/admin/logs");
      const data = await res.json();
      setLogs(data);
    } catch {
      // Mock data nếu API chưa có
      setLogs([
        { id: "L001", type: "Info",    message: "User john@example.com logged in",        timestamp: "2026-03-09 10:23:45" },
        { id: "L002", type: "Warning", message: "High server load detected (85%)",         timestamp: "2026-03-09 09:15:22" },
        { id: "L003", type: "Error",   message: "Failed upload attempt from USR-005",      timestamp: "2026-03-09 08:45:10" },
        { id: "L004", type: "Info",    message: "New user registered: kayne_wall456",      timestamp: "2026-03-09 07:30:00" },
        { id: "L005", type: "Warning", message: "Refresh token expired for USR-002",       timestamp: "2026-03-08 23:10:05" },
        { id: "L006", type: "Error",   message: "Database connection timeout",             timestamp: "2026-03-08 21:05:33" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = ["ID,Type,Message,Timestamp",
      ...filtered.map(l => `${l.id},${l.type},"${l.message}",${l.timestamp}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filtered = logs.filter(log => {
    const matchType = filter === "All" || log.type === filter;
    const matchSearch = log.message.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const counts = {
    Error:   logs.filter(l => l.type === "Error").length,
    Warning: logs.filter(l => l.type === "Warning").length,
    Info:    logs.filter(l => l.type === "Info").length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">System Logs</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor system events and errors</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-500/10 text-sm transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 mb-6">
        {(["Error", "Warning", "Info"] as const).map(type => (
          <div key={type} className={`px-3 py-1.5 rounded-lg border text-sm ${LOG_COLORS[type].border} ${LOG_COLORS[type].text} ${LOG_COLORS[type].bg}`}>
            {type}: {counts[type]}
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {(["All", "Info", "Warning", "Error"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800 border border-blue-500/30 text-white text-sm"
          />
        </div>
      </div>

      {/* Log list */}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => (
            <div key={log.id}
              className={`flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border ${LOG_COLORS[log.type].border}`}>
              <LogIcon type={log.type} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{log.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">{log.timestamp}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${LOG_COLORS[log.type].border} ${LOG_COLORS[log.type].text}`}>
                {log.type}
              </span>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-10">No logs found</p>
          )}
        </div>
      )}
    </div>
  );
}