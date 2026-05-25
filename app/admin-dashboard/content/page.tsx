'use client';
import { useState } from "react";
import { CheckCircle, Trash2, Flag, ShieldAlert, AlertTriangle } from "lucide-react";
import { useConfirm } from "@/app/components/ui/confirm-dialog";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface ContentItem {
  id: string;
  title: string;
  uploadedBy: string;
  type: string;
  flagReason: string;
  createdAt: string;
}

const INITIAL_ITEMS: ContentItem[] = [
  { id: "C001", title: "Product AR Model",  uploadedBy: "john@example.com",  type: "3D Model", flagReason: "Possible copyright violation",   createdAt: "2026-03-08" },
  { id: "C002", title: "Fashion Showcase",  uploadedBy: "sarah@example.com", type: "Video",    flagReason: "Inappropriate content",          createdAt: "2026-03-07" },
  { id: "C003", title: "Cosmetics AR Demo", uploadedBy: "mike@example.com",  type: "3D Model", flagReason: "Misleading product description",  createdAt: "2026-03-06" },
];

const TYPE_COLORS: Record<string, string> = {
  "3D Model": "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  "Video":    "bg-purple-500/10 text-purple-300 border-purple-500/20",
  "Image":    "bg-blue-500/10 text-blue-300 border-blue-500/20",
};

export default function ContentModerationPage() {
  const [items, setItems] = useState<ContentItem[]>(INITIAL_ITEMS);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const handleApprove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Content approved and cleared from queue.");
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: "Delete Content",
      message: `Permanently delete "${title}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Content deleted.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <ShieldAlert className="w-6 h-6 text-rose-500" /> Content Moderation
          </h1>
          <p className="text-slate-400 text-sm mt-1">Review flagged platform content and enforce moderation guidelines</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Static Data Simulation
          </div>
          {items.length > 0 && (
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.1)]">
              {items.length} pending reviews
            </span>
          )}
        </div>
      </div>

      {/* Content list */}
      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-[#0d1324]/20 rounded-2xl border border-emerald-500/20 shadow-lg"
        >
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
          <p className="text-white font-bold text-base tracking-wide">All queue entries cleared!</p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">No additional media reports are awaiting moderation</p>
        </motion.div>
      ) : (
        <div className="max-h-[460px] overflow-y-auto pr-2 space-y-3.5">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className="flex flex-col md:flex-row md:items-center justify-between p-4.5 rounded-2xl bg-[#0d1324]/40 border border-rose-500/10 hover:border-rose-500/30 hover:bg-[#0d1324]/60 transition-all gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_0_10px_rgba(244,63,94,0.05)]">
                    <Flag className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-white font-semibold text-sm tracking-wide truncate">{item.title}</p>
                    <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 font-medium">
                      <span className="text-slate-400">{item.uploadedBy}</span>
                      <span>·</span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                          TYPE_COLORS[item.type] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {item.type}
                      </span>
                      <span>·</span>
                      <span>Uploaded {item.createdAt}</span>
                    </div>
                    <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 pt-0.5">
                      <Flag className="w-3.5 h-3.5 shrink-0" /> {item.flagReason}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 shrink-0 border-t border-white/[0.04] md:border-0 pt-3 md:pt-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprove(item.id)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/5 transition-all cursor-pointer font-bold"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve Content
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDelete(item.id, item.title)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs border border-rose-500/30 text-rose-400 rounded-xl hover:bg-rose-500/5 transition-all cursor-pointer font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Content
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {ConfirmDialogComponent}
    </div>
  );
}