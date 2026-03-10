'use client';
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { CheckCircle, Trash2, Flag } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  uploadedBy: string;
  type: string;
  flagReason: string;
  createdAt: string;
}

export default function ContentModerationPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await apiFetch("/admin/content");
      const data = await res.json();
      setItems(data);
    } catch {
      // nếu API chưa có, dùng mock data
      setItems([
        { id: "C001", title: "Product AR Model", uploadedBy: "john@example.com", type: "3D Model", flagReason: "Copyright violation", createdAt: "2026-03-08" },
        { id: "C002", title: "Fashion Showcase", uploadedBy: "sarah@example.com", type: "Video", flagReason: "Inappropriate content", createdAt: "2026-03-07" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/admin/content/${id}/approve`, { method: "PUT" });
      setItems(prev => prev.filter(item => item.id !== id));
      setActionMsg("✅ Content approved");
    } catch {
      setActionMsg("❌ Action failed");
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content permanently?")) return;
    try {
      await apiFetch(`/admin/content/${id}`, { method: "DELETE" });
      setItems(prev => prev.filter(item => item.id !== id));
      setActionMsg("🗑 Content deleted");
    } catch {
      setActionMsg("❌ Action failed");
    }
    setTimeout(() => setActionMsg(""), 3000);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Moderation</h1>
          <p className="text-gray-400 text-sm mt-1">Review and moderate flagged content</p>
        </div>
        {items.length > 0 && (
          <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full text-sm">
            {items.length} pending
          </span>
        )}
      </div>

      {actionMsg && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-slate-800 text-sm text-white border border-blue-500/30">
          {actionMsg}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/30 rounded-xl border border-blue-500/20">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-medium">All clear!</p>
          <p className="text-gray-400 text-sm">No content pending moderation</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-red-500/20">
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-sm text-gray-400">
                    {item.uploadedBy} • {item.type} • {item.createdAt}
                  </p>
                  <p className="text-xs text-red-400 mt-1">
                    Flag reason: {item.flagReason}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleApprove(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}