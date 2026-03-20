import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Send, Upload, ArrowLeft, FileBox, Trash2, Eye, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { CreativeOrder, ORDER_STATUS_CONFIG, PRODUCTION_STAGES } from "./types";
import OBJModelViewer from "../components/3d/OBJModelViewer";

interface Attachment {
  AttachmentId: number;
  FileName: string;
  MimeType: string;
  Base64Data: string;
  CreatedAt: string;
}

interface Props {
  order: CreativeOrder;
  onBack: () => void;
}

export function JobDetailView({ order, onBack }: Props) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.Status);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [showPreview, setShowPreview] = useState<Attachment | null>(null);

  const fetchAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.data ?? data);
      }
    } catch (e) {
      console.error("Failed to fetch attachments", e);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".obj")) {
      setMessage({ type: "error", text: "Please select a .obj file." });
      return;
    }

    setUpdating(true);
    setMessage(null);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          let str = reader.result as string;
          resolve(str.split(",")[1] || str);
        };
        reader.onerror = reject;
      });

      const res = await apiFetch(`/orders/${order.OrderId}/attachments`, {
        method: "POST",
        body: JSON.stringify({
          FileName: file.name,
          MimeType: "application/octet-stream",
          Base64Data: base64,
        }),
      });

      if (!res.ok) throw new Error("Upload failed");

      setMessage({ type: "success", text: "3D model uploaded successfully!" });
      fetchAttachments();
    } catch (e: any) {
      setMessage({ type: "error", text: e.message ?? "Upload failed." });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAttachment = async (id: number) => {
    if (!confirm("Remove this attachment?")) return;
    try {
      await apiFetch(`/attachments/${id}`, { method: "DELETE" });
      setAttachments(prev => prev.filter(a => a.AttachmentId !== id));
    } catch (e) {
      alert("Failed to delete attachment");
    }
  };

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

  useEffect(() => { fetchAttachments(); }, []);

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
            <div className={`mb-4 flex items-center gap-2 text-sm rounded-xl px-4 py-2.5 border ${message.type === "success"
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
              { label: "Order ID", value: `#${order.OrderId}` },
              { label: "Company", value: order.CompanyName ?? "—" },
              { label: "Package", value: order.PackageName ?? "—" },
              { label: "Platform", value: order.TargetPlatform ?? "Not specified" },
              { label: "Deadline", value: order.Deadline ? new Date(order.Deadline).toLocaleDateString() : "No deadline" },
              { label: "Created", value: new Date(order.CreatedAt).toLocaleDateString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-900/40 border border-white/6 rounded-xl p-3">
                <p className="text-slate-500 text-xs mb-1">{label}</p>
                <p className="text-white text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* Brief & Feedback */}
          {order.Brief && (
            <div className={`rounded-xl p-4 mb-6 border ${order.Brief.includes("[REVISION FEEDBACK")
              ? "bg-yellow-500/10 border-yellow-500/30"
              : "bg-blue-500/5 border-blue-500/15"
              }`}>
              {order.Brief.includes("[REVISION FEEDBACK") ? (
                <>
                  <p className="text-yellow-500 text-xs uppercase tracking-widest font-bold mb-2">Revision Feedback Required</p>
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {order.Brief.split("Original Brief:")[0].replace(/\[REVISION FEEDBACK.*?\]:/, "").trim()}
                  </p>
                  <div className="mt-4 pt-4 border-t border-yellow-500/20">
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">Original Brief</p>
                    <p className="text-slate-400 text-xs line-clamp-3 italic">
                      {order.Brief.split("Original Brief:")[1]?.trim() || order.Brief}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Customer Brief</p>
                  <p className="text-white text-sm leading-relaxed">{order.Brief}</p>
                </>
              )}
            </div>
          )}

          {/* 3D Assets & Attachments */}
          <div className="mt-8 border-t border-white/6 pt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-slate-400 text-xs uppercase tracking-widest">3D Deliverables / Attachments</p>
              <div className="relative">
                <input type="file" accept=".obj" onChange={handleFileUpload} className="hidden" id="obj-upload" disabled={updating} />
                <label htmlFor="obj-upload" className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/30 text-cyan-400 text-xs font-semibold cursor-pointer hover:bg-cyan-500/10 transition
                  ${updating ? "opacity-50 pointer-events-none" : ""}
                `}>
                  {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Upload
                </label>
              </div>
            </div>

            {loadingAttachments ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              </div>
            ) : attachments.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-slate-900/40 border border-dashed border-white/6">
                <FileBox className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm italic">No 3D models uploaded yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {attachments.map(att => (
                  <div key={att.AttachmentId} className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/6 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileBox className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{att.FileName}</p>
                        <p className="text-slate-500 text-[10px]">{new Date(att.CreatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {att.FileName.toLowerCase().endsWith(".obj") && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                          onClick={() => setShowPreview(att)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                        onClick={() => handleDeleteAttachment(att.AttachmentId)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-[#0f1729] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/6 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Preview: {showPreview.FileName}
                  </h3>
                  <button onClick={() => setShowPreview(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 whitespace-nowrap">
                    Close Preview
                  </button>
                </div>
                <div className="p-6">
                  <OBJModelViewer objData={showPreview.Base64Data} />
                </div>
                <div className="p-4 bg-slate-900/50 border-t border-white/6 text-center text-xs text-slate-500">
                  Drag to rotate • Scroll to zoom • Right-click to pan
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}