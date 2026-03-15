"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Package, Box, Clock, Star, Loader2 } from "lucide-react";
import { CreativeOrder, Asset } from "./types";
import { JobsTab } from "./JobsTab";
import { AssetsTab } from "./AssetTab";

type TabId = "jobs" | "assets";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("jobs");

  // Shared data for stats row only
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);

  useEffect(() => {
    apiFetch("/orders/my")
      .then(r => r.json())
      .then(d => { const arr = d.data ?? d; setOrders(Array.isArray(arr) ? arr : []); })
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));

    apiFetch("/assets/marketplace")
      .then(r => r.json())
      .then(d => { const arr = d.data ?? d; setAssets(Array.isArray(arr) ? arr : []); })
      .catch(() => setAssets([]))
      .finally(() => setLoadingAssets(false));
  }, []);

  const activeOrders    = orders.filter(o => !["COMPLETED","DELIVERED","CANCELLED"].includes(o.Status)).length;
  const newOrderCount   = orders.filter(o => o.Status === "NEW").length;
  const draftAssets     = assets.filter(a => a.PublishStatus === "DRAFT").length;
  const pendingAssets   = assets.filter(a => a.PublishStatus === "PENDING").length;
  const publishedAssets = assets.filter(a => a.PublishStatus === "PUBLISHED").length;

  const STATS = [
    { label: "Active Tasks",     value: loadingOrders ? null : activeOrders,    sub: `${newOrderCount} new`,  color: "from-blue-600/20 to-cyan-600/20 border-blue-500/30",       icon: Package, iconColor: "text-blue-400"   },
    { label: "Draft Assets",     value: loadingAssets ? null : draftAssets,     sub: "Ready to submit",       color: "from-slate-600/20 to-slate-700/20 border-slate-500/30",    icon: Box,     iconColor: "text-slate-400"  },
    { label: "Pending Review",   value: loadingAssets ? null : pendingAssets,   sub: "Awaiting manager",      color: "from-yellow-600/20 to-orange-600/20 border-yellow-500/30", icon: Clock,   iconColor: "text-yellow-400" },
    { label: "Published Assets", value: loadingAssets ? null : publishedAssets, sub: "Live on marketplace",   color: "from-green-600/20 to-emerald-600/20 border-green-500/30",  icon: Star,    iconColor: "text-green-400"  },
  ];

  const TABS: { id: TabId; label: string; Icon: typeof Package }[] = [
    { id: "jobs",   label: "Job / Task List", Icon: Package },
    { id: "assets", label: "My Assets",       Icon: Box     },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">Artist Workspace</h1>
          <p className="text-slate-400">
            {user?.name ? `Welcome back, ${user.name}` : "Manage tasks and upload assets for marketplace"}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map(({ label, value, sub, color, icon: Icon, iconColor }) => (
            <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-400 text-xs font-medium">{label}</p>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              {value === null
                ? <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
                : <><p className="text-3xl font-bold text-white mb-1">{value}</p>
                   <p className={`text-xs ${iconColor}`}>{sub}</p></>
              }
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 p-1 bg-slate-800/50 border border-white/8 rounded-xl w-fit mb-6">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {activeTab === "jobs"   && <JobsTab />}
        {activeTab === "assets" && <AssetsTab />}
      </div>
    </div>
  );
}