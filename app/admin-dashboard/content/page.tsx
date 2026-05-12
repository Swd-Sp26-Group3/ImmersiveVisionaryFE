'use client';
import { useState, useMemo } from "react";
import { CheckCircle, Trash2, Flag, ShieldAlert, AlertTriangle } from "lucide-react";
import { useConfirm } from "@/app/components/ui/confirm-dialog";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  title: string;
  uploadedBy: string;
  type: string;
  flagReason: string;
  createdAt: string;
}

// ── Static data (BE /admin/content endpoint not yet implemented) ──────────────
const INITIAL_ITEMS: ContentItem[] = [
  { id: "C001", title: "Product AR Model",  uploadedBy: "john@example.com",  type: "3D Model", flagReason: "Possible copyright violation",   createdAt: "2026-03-08" },
  { id: "C002", title: "Fashion Showcase",  uploadedBy: "sarah@example.com", type: "Video",    flagReason: "Inappropriate content",          createdAt: "2026-03-07" },
  { id: "C003", title: "Cosmetics AR Demo", uploadedBy: "mike@example.com",  type: "3D Model", flagReason: "Misleading product description",  createdAt: "2026-03-06" },
];

const TYPE_COLORS: Record<string, string> = {
  "3D Model": "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  "Video":    "bg-purple-500/15 text-purple-400 border-purple-500/25",
  "Image":    "bg-blue-500/15 text-blue-400 border-blue-500/25",
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Content Moderation
          </h1>
          <p className="text-gray-400 text-sm mt-1">Review and moderate flagged content</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Static data — live API pending
          </div>
          {items.length > 0 && (
            <span className="px-3 py-1.5 bg-red-500/15 border border-red-500/25 text-red-400 rounded-full text-sm font-medium">
              {items.length} pending
            </span>
          )}
        </div>
      </div>

      {/* Content list */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-green-500/20">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium">All clear!</p>
          <p className="text-gray-400 text-sm mt-1">No content pending moderation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/50 border border-red-500/15 hover:border-red-500/30 transition"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flag className="w-4 h-4 text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-400">
                    <span>{item.uploadedBy}</span>
                    <span>·</span>
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${
                        TYPE_COLORS[item.type] ?? "bg-slate-500/15 text-slate-400 border-slate-500/25"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span>·</span>
                    <span>{item.createdAt}</span>
                  </div>
                  <p className="text-xs text-red-400/80 mt-1 flex items-center gap-1">
                    <Flag className="w-3 h-3" /> {item.flagReason}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0 ml-4">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-green-500/40 text-green-400 rounded-xl hover:bg-green-500/10 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-red-500/40 text-red-400 rounded-xl hover:bg-red-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {ConfirmDialogComponent}
    </div>
  );
}