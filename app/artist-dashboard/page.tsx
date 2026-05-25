"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Package, Box, Clock, Star, Loader2 } from "lucide-react";
import { CreativeOrder, Asset } from "./types";
import { JobsTab } from "./JobsTab";
import { AssetsTab } from "./AssetTab";
import { motion, AnimatePresence } from "motion/react";

type TabId = "jobs" | "assets";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 25 } }
};

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
    {
      label: "Active Tasks",
      value: loadingOrders ? null : activeOrders,
      sub: `${newOrderCount} new assigned`,
      bg: "from-blue-500/10 to-cyan-500/10",
      border: "border-blue-500/20",
      icon: Package,
      iconColor: "text-blue-400"
    },
    {
      label: "Draft Assets",
      value: loadingAssets ? null : draftAssets,
      sub: "Ready to submit",
      bg: "from-slate-500/10 to-slate-600/10",
      border: "border-slate-500/20",
      icon: Box,
      iconColor: "text-slate-400"
    },
    {
      label: "Pending Review",
      value: loadingAssets ? null : pendingAssets,
      sub: "Awaiting manager",
      bg: "from-yellow-500/10 to-amber-500/10",
      border: "border-yellow-500/20",
      icon: Clock,
      iconColor: "text-amber-400"
    },
    {
      label: "Published Assets",
      value: loadingAssets ? null : publishedAssets,
      sub: "Live on marketplace",
      bg: "from-emerald-500/10 to-teal-500/10",
      border: "border-emerald-500/20",
      icon: Star,
      iconColor: "text-emerald-400"
    },
  ];

  const TABS: { id: TabId; label: string; Icon: typeof Package }[] = [
    { id: "jobs",   label: "Job & Task Directory", Icon: Package },
    { id: "assets", label: "My Marketplace Assets", Icon: Box     },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8 w-full">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Artist Workspace
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {user?.name ? `Welcome back, ${user.name} — manage assigned tasks and submit your 3D assets` : "Coordinate and upload production assets"}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0d1324]/80 border border-white/[0.06] w-fit backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">Active Creator Stream</span>
          </div>
        </div>

        {/* Stats Row */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {STATS.map(({ label, value, sub, bg, border, icon: Icon, iconColor }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-[#0d1324]/40 border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm shadow-md hover:border-cyan-500/20 transition-all flex items-start justify-between relative overflow-hidden group"
            >
              <div className="space-y-2">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{label}</p>
                <div className="flex items-baseline gap-2">
                  {value === null ? (
                    <Loader2 className={`w-6 h-6 ${iconColor} animate-spin`} />
                  ) : (
                    <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
                  )}
                </div>
                <p className="text-slate-500 text-[10px] font-semibold">{sub}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${bg} border ${border} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs Menu */}
        <div className="flex border-b border-white/[0.06] gap-6">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-4 text-sm font-bold flex items-center gap-2 relative transition-colors cursor-pointer ${
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                {label}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "jobs"   && <JobsTab />}
            {activeTab === "assets" && <AssetsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}