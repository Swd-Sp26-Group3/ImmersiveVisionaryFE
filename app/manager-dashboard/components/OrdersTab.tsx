"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Eye, UserCheck, Loader2, AlertCircle, CheckCircle2,
  RefreshCw, X, ArrowLeft, Package, ShoppingBag,
  Building2, DollarSign, Clock, RotateCcw, Upload, Plus, Edit, Tag
} from "lucide-react";
import { apiFetch, getApiBaseUrl, process3DModelFiles } from "@/lib/api";
import { Artist, CreativeOrder, CreativeOrderStatus, STATUS_CONFIG } from "./type";
import { motion, AnimatePresence } from "motion/react";

interface MarketplaceOrder {
  MpOrderId: number;
  AssetId: number;
  BuyerCompanyId: number;
  SellerCompanyId: number;
  Price: number | null;
  Status: "PENDING" | "PAID" | "DELIVERED" | "REFUNDED";
  CreatedAt: string;
  AssetName?: string | null;
  Category?: string | null;
  Industry?: string | null;
  BuyerCompanyName?: string | null;
  SellerCompanyName?: string | null;
  BuyerEmail?: string | null;
  BuyerPhone?: string | null;
  BuyerName?: string | null;
}

const MP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  PAID: { label: "Paid", color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  DELIVERED: { label: "Delivered", color: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" },
  REFUNDED: { label: "Refunded", color: "bg-rose-500/10 text-rose-400 border border-rose-500/20" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
};

// ===================== AssignTaskModal =====================
function AssignTaskModal({
  order, artists, onClose, onAssigned,
}: {
  order: CreativeOrder;
  artists: Artist[];
  onClose: () => void;
  onAssigned: (updatedOrder: CreativeOrder) => void;
}) {
  const [selectedArtist, setSelectedArtist] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  const handleAssign = async () => {
    if (!selectedArtist) return;
    setAssigning(true); setError("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: "IN_PRODUCTION", ArtistId: selectedArtist }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to assign");
      const data = await res.json();
      onAssigned(data.data ?? data);
    } catch (err: any) {
      setError(err.message ?? "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1324] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-white/[0.01]">
          <h2 className="text-white font-bold text-base tracking-tight">Dispatch Project Order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="bg-[#080d1a] rounded-xl p-4 border border-white/[0.04]">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Product</p>
            <p className="text-white font-semibold text-sm">{order.ProductName ?? `Order #${order.OrderId}`}</p>
            <p className="text-slate-400 text-xs mt-0.5">Ref ID: #{order.OrderId} · Company: {order.CompanyName}</p>
            {order.Brief && <p className="text-slate-500 text-xs mt-2.5 line-clamp-2 leading-relaxed italic">"{order.Brief}"</p>}
          </div>

          <div className="space-y-2.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Select Available Artist *</Label>
            {artists.length === 0 ? (
              <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/5 rounded-xl px-3.5 py-2.5 border border-amber-500/10">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> No registered 3D artists available
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {artists.map((artist) => (
                  <button
                    key={artist.UserId}
                    onClick={() => setSelectedArtist(artist.UserId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      selectedArtist === artist.UserId
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/[0.06] bg-white/[0.01] hover:border-slate-600"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{artist.UserName}</p>
                      <p className="text-slate-500 text-xs truncate mt-0.5">{artist.Email ?? "No email address"}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      artist.IsActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {artist.IsActive ? "Active" : "Inactive"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Production Memo / Guidelines</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Provide guidelines, technical constraints or deadlines..."
              rows={3}
              className="bg-[#080d1a] border-white/[0.06] text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all rounded-xl resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 rounded-xl px-3.5 py-2.5 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 p-5 border-t border-white/[0.06] bg-white/[0.01]">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/[0.08] hover:bg-white/[0.02] text-slate-300">Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedArtist || assigning}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl"
          >
            {assigning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Dispatching...</>
            ) : (
              <><UserCheck className="w-3.5 h-3.5 mr-1.5" />Dispatch Project</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ===================== EditOrderModal =====================
function EditOrderModal({
  order, onClose, onUpdated,
}: {
  order: CreativeOrder;
  onClose: () => void;
  onUpdated: (updated: CreativeOrder) => void;
}) {
  const [formData, setFormData] = useState({
    ProjectName: order.ProjectName || "",
    Budget: order.Budget || "",
    Brief: order.Brief || "",
    Deadline: order.Deadline ? order.Deadline.split('T')[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to save");
      const data = await res.json();
      onUpdated(data.data ?? data);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[160] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1324] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-white/[0.01]">
          <h2 className="text-white font-bold text-base tracking-tight">Edit Order Specifications</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Project Name</Label>
            <input
              type="text"
              value={formData.ProjectName}
              onChange={(e) => setFormData({ ...formData, ProjectName: e.target.value })}
              className="w-full bg-[#080d1a] border border-white/[0.06] rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Budget / Price (VND)</Label>
            <input
              type="text"
              value={formData.Budget}
              onChange={(e) => setFormData({ ...formData, Budget: e.target.value })}
              className="w-full bg-[#080d1a] border border-white/[0.06] rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
              placeholder="e.g. 5.000.000 VND"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Brief / Client Request</Label>
            <Textarea
              value={formData.Brief}
              onChange={(e) => setFormData({ ...formData, Brief: e.target.value })}
              rows={4}
              className="bg-[#080d1a] border-white/[0.06] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all rounded-xl resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Deadline</Label>
            <input
              type="date"
              value={formData.Deadline}
              onChange={(e) => setFormData({ ...formData, Deadline: e.target.value })}
              className="w-full bg-[#080d1a] border border-white/[0.06] rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          {error && <p className="text-rose-400 text-xs bg-rose-500/10 p-2.5 border border-rose-500/20 rounded-xl">{error}</p>}
        </div>
        <div className="flex gap-2.5 p-5 border-t border-white/[0.06] bg-white/[0.01]">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/[0.08] hover:bg-white/[0.02] text-slate-300">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : "Save Specifications"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ===================== Creative Order Detail =====================
function CreativeOrderDetail({
  order: initialOrder, artists, onBack, onOrderUpdated,
}: {
  order: CreativeOrder;
  artists: Artist[];
  onBack: () => void;
  onOrderUpdated: (updated: CreativeOrder) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [assignModal, setAssignModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  const handleStatusChange = async (newStatus: CreativeOrderStatus) => {
    setUpdatingStatus(true); setStatusError("");
    try {
      const res = await apiFetch(`/orders/${order.OrderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ Status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Update failed");
      const updated = (await res.json()).data;
      setOrder(updated); onOrderUpdated(updated);
    } catch (err: any) {
      setStatusError(err.message ?? "Status update failed.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const STAGES = [
    { key: "NEW", label: "Order Received" },
    { key: "IN_PRODUCTION", label: "3D Production" },
    { key: "REVIEW", label: "Client Review" },
    { key: "COMPLETED", label: "Completed" },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const NEXT_STATUS_MAP: Partial<Record<CreativeOrderStatus, CreativeOrderStatus>> = {
    NEW: "IN_PRODUCTION", IN_PRODUCTION: "REVIEW", REVIEW: "COMPLETED",
  };
  const nextStatus = NEXT_STATUS_MAP[order.Status];
  const stageIdx = STAGES.findIndex(s => s.key === order.Status);

  const statusLabel = STATUS_CONFIG[order.Status]?.label ?? order.Status;
  const statusColor = STATUS_CONFIG[order.Status]?.color ?? "bg-slate-600";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02] rounded-xl">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to List
        </Button>
        <h2 className="text-white font-bold text-base tracking-tight">Creative Brief Specifications</h2>
      </div>

      <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
        <CardHeader className="border-b border-white/[0.06] pb-5 bg-white/[0.01]">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-white text-lg font-bold mb-2">
                {order.ProductName ?? `Creative Order #${order.OrderId}`}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusColor}`}>
                  {statusLabel}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">#{order.OrderId}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {order.CompanyName ?? `Company #${order.CompanyId}`}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setEditModal(true)}
                variant="outline"
                className="border-white/[0.08] hover:bg-white/[0.02] text-slate-300 rounded-xl text-xs font-bold h-9"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Modify Specifications
              </Button>
              {order.Status === "NEW" && (
                <Button onClick={() => setAssignModal(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl h-9">
                  <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Dispatch to Artist
                </Button>
              )}
              {nextStatus && order.Status !== "NEW" && (
                <Button
                  onClick={() => handleStatusChange(nextStatus)}
                  disabled={updatingStatus}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl h-9"
                >
                  {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />}
                  Promote to {STATUS_CONFIG[nextStatus]?.label}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {statusError && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 rounded-xl px-3.5 py-2.5 border border-rose-500/20">
              <AlertCircle className="w-4 h-4" /> {statusError}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium">
            {[
              { label: "Brief ID", value: `#${order.OrderId}` },
              { label: "Project Name", value: order.ProjectName ?? "Not specified" },
              { label: "Budget", value: order.Budget ?? "Not specified", color: "text-emerald-400 font-bold" },
              { label: "Company", value: order.CompanyName ?? `#${order.CompanyId}` },
              { label: "Target Product", value: order.ProductName ?? `#${order.ProductId}` },
              { label: "Render Package", value: order.PackageName ?? `#${order.PackageId}` },
              { label: "AR Platform", value: order.TargetPlatform ?? "Not specified" },
              { label: "Deadline", value: order.Deadline ? new Date(order.Deadline).toLocaleDateString() : "No deadline specified", color: "text-amber-400 font-semibold" },
              { label: "Created On", value: new Date(order.CreatedAt).toLocaleDateString() },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#080d1a]/50 rounded-xl p-3 border border-white/[0.04]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
                <p className={`text-white font-medium ${color || ""}`}>{value}</p>
              </div>
            ))}
            {order.BuyerName && (
              <div className="bg-[#080d1a]/50 rounded-xl p-3 border border-white/[0.04]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Purchasing Rep</p>
                <p className="text-white font-medium">{order.BuyerName}</p>
              </div>
            )}
            {order.BuyerPhone && (
              <div className="bg-[#080d1a]/50 rounded-xl p-3 border border-white/[0.04]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Rep Contacts</p>
                <p className="text-white font-medium">{order.BuyerPhone}</p>
              </div>
            )}
          </div>

          {order.Brief && (
            <div className="bg-[#080d1a]/50 rounded-xl p-4 border border-white/[0.04] space-y-1">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Creative Brief</p>
              <p className="text-white text-sm leading-relaxed">{order.Brief}</p>
            </div>
          )}

          {/* Production stages */}
          <div className="space-y-4">
            <p className="text-white text-sm font-bold tracking-tight">Production Milestone Pipeline</p>
            <div className="relative pl-1">
              <div className="absolute left-[9px] top-3.5 bottom-3.5 w-px bg-white/[0.08]" />
              <div className="space-y-3.5">
                {STAGES.map((s, i) => {
                  const done = i < stageIdx;
                  const current = i === stageIdx;
                  return (
                    <div key={s.key} className="flex items-center gap-3 relative z-10">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                        done 
                          ? "bg-emerald-500" 
                          : current 
                          ? "bg-purple-600 ring-4 ring-purple-500/25 text-white" 
                          : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                      }`}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : i + 1}
                      </div>
                      <span className={`text-xs font-semibold ${current ? "text-white font-bold" : done ? "text-slate-300" : "text-slate-600"}`}>
                        {s.label}
                      </span>
                      {current && (
                        <span className="ml-auto text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
                          Active Stage
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {assignModal && (
        <AssignTaskModal
          order={order} artists={artists}
          onClose={() => setAssignModal(false)}
          onAssigned={(updated) => { setOrder(updated); onOrderUpdated(updated); setAssignModal(false); }}
        />
      )}

      {editModal && (
        <EditOrderModal
          order={order}
          onClose={() => setEditModal(false)}
          onUpdated={(updated) => { setOrder(updated); onOrderUpdated(updated); }}
        />
      )}
    </div>
  );
}

// Helper to compress file using gzip and encode to base64
const compressFileToGzipBase64 = async (file: File): Promise<string> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const cs = new CompressionStream("gzip");
  const writer = cs.writable.getWriter();
  writer.write(bytes as any);
  writer.close();
  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const compressedBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressedBytes.set(chunk, offset);
    offset += chunk.length;
  }
  let binary = "";
  const len = compressedBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressedBytes[i]);
  }
  return "gzip:" + btoa(binary);
};

const process3DModelFiles = async (files: File[]): Promise<string> => {
  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
    const arrayBuf = await files[0].arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return "zip:" + btoa(binary);
  }

  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".obj")) {
    return compressFileToGzipBase64(files[0]);
  }

  const hasObj = files.some(f => f.name.toLowerCase().endsWith(".obj"));
  if (!hasObj) {
    throw new Error("No .obj file found in the selected files.");
  }

  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.name, f);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const arrayBuf = await zipBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return "zip:" + btoa(binary);
};

// ===================== Edit Asset Modal =====================
function EditAssetModal({ assetId, onClose, onUpdated }: { assetId: number; onClose: () => void; onUpdated: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploading(true); setError("");
    try {
      const base64Data = await process3DModelFiles(files);
      const mainFile = files.find(f => f.name.toLowerCase().endsWith(".obj")) || files[0];
      const displayName = files.length > 1 ? `${mainFile.name} (+${files.length - 1} files)` : mainFile.name;

      // Route through Edge proxy to bypass Vercel's 4.5 MB request payload limit and avoid CORS issues.
      const res = await apiFetch(`/api/proxy/asset-versions/${assetId}`, {
        method: "POST",
        body: JSON.stringify({
          FileFormat: "OBJ",
          FileUrl: displayName,
          Base64Data: base64Data,
          PolyCount: 0,
          TextureSize: "Unknown"
        }),
      });
      if (!res.ok) throw new Error("Upload failed");

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0d1324] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-white font-bold text-base tracking-tight">Reupload Model Source</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-slate-400 text-xs leading-relaxed">Upload a replacement OBJ model, MTL, textures, or a ZIP archive to deploy a new asset version.</p>
          <div className="border-2 border-dashed border-white/[0.06] rounded-xl p-8 text-center hover:border-purple-500/40 transition-colors relative bg-white/[0.01]">
            <input
              type="file"
              accept=".obj,.mtl,.zip,.png,.jpg,.jpeg"
              multiple
              onChange={handleUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <div className="flex flex-col items-center">
              {uploading ? <Loader2 className="w-8 h-8 text-purple-400 animate-spin" /> : <Upload className="w-8 h-8 text-slate-500 mb-2" />}
              <p className="text-white text-xs font-medium">{uploading ? "Parsing 3D files..." : "Click to select replacement files"}</p>
            </div>
          </div>
          {error && <p className="text-rose-400 text-xs bg-rose-500/10 p-2.5 border border-rose-500/20 rounded-xl">{error}</p>}
        </div>
        <div className="p-4 bg-white/[0.01] border-t border-white/[0.06] text-right">
          <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:bg-white/[0.02] hover:text-white text-xs font-semibold">Cancel</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ===================== Marketplace Order Detail =====================
function MarketplaceOrderDetail({
  order: initialOrder, onBack, onOrderUpdated,
}: {
  order: MarketplaceOrder;
  onBack: () => void;
  onOrderUpdated: (updated: MarketplaceOrder) => void;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [showEditAsset, setShowEditAsset] = useState(false);

  const handleRefund = async () => {
    if (!confirm(`Refund marketplace order #${order.MpOrderId}?`)) return;
    setUpdating(true); setError("");
    try {
      const res = await apiFetch(`/marketplace-orders/${order.MpOrderId}/refund`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Refund failed");
      setOrder({ ...order, Status: "REFUNDED" });
      onOrderUpdated({ ...order, Status: "REFUNDED" });
    } catch (err: any) {
      setError(err.message ?? "Refund failed.");
    } finally {
      setUpdating(false);
    }
  };

  const cfg = MP_STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "bg-slate-600/10 text-slate-300 border-slate-500/20" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02] rounded-xl">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to List
        </Button>
        <h2 className="text-white font-bold text-base tracking-tight">Marketplace Order Details</h2>
      </div>

      <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
        <CardHeader className="border-b border-white/[0.06] pb-5 bg-white/[0.01]">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShoppingBag className="w-5 h-5 text-purple-400 shrink-0" />
                <CardTitle className="text-white text-lg font-bold">
                  {order.AssetName || "3D Store Asset"}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-mono">Invoice #{order.MpOrderId}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowEditAsset(true)}
                variant="outline"
                className="border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/5 text-slate-300 hover:text-purple-400 rounded-xl h-9 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Edit Asset OBJ
              </Button>
              {(order.Status === "PAID" || order.Status === "DELIVERED") && (
                <Button
                  onClick={handleRefund}
                  disabled={updating}
                  variant="outline"
                  className="border-rose-500/30 text-rose-400 hover:bg-rose-500/5 rounded-xl h-9 text-xs font-bold"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                  Issue Refund
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 rounded-xl px-3.5 py-2.5 border border-rose-500/20">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Asset Detail Section */}
            <div className="space-y-3">
              <p className="text-purple-400 text-xs font-bold uppercase tracking-wider">Asset Specifications</p>
              <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                {[
                  { label: "Asset Name", value: order.AssetName || "3D Asset" },
                  { label: "Category", value: order.Category || "3D/AR" },
                  { label: "Industry Focus", value: order.Industry || "Generic" },
                  { label: "Asset Price", value: order.Price != null ? `${order.Price.toLocaleString("vi-VN")} ₫` : "—", color: "text-emerald-400 font-bold" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#080d1a]/50 rounded-xl p-3 border border-white/[0.04]">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
                    <p className={`text-white font-medium ${color || ""}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buyer Detail Section */}
            <div className="space-y-3">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">Buyer Ledger Information</p>
              <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                {[
                  { label: "Purchasing Rep", value: order.BuyerName || "—" },
                  { label: "Contact Phone", value: order.BuyerPhone || "—" },
                  { label: "Company Profile", value: order.BuyerCompanyName || `ID: ${order.BuyerCompanyId}` },
                  { label: "Email Address", value: order.BuyerEmail || "Not provided" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#080d1a]/50 rounded-xl p-3 border border-white/[0.04]">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
                    <p className="text-white font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MP Order status steps */}
          <div className="space-y-4">
            <p className="text-white text-sm font-bold tracking-tight">Order Fulfilment Pipeline</p>
            <div className="relative pl-1">
              <div className="absolute left-[9px] top-3.5 bottom-3.5 w-px bg-white/[0.08]" />
              {[
                { key: "PENDING", label: "Invoice Placed" },
                { key: "PAID", label: "Payment Deposited" },
                { key: "DELIVERED", label: "Product Key Delivered" },
              ].map((s, i) => {
                const statusOrder = ["PENDING", "PAID", "DELIVERED", "REFUNDED"];
                const curIdx = statusOrder.indexOf(order.Status);
                const sIdx = statusOrder.indexOf(s.key);
                const done = curIdx > sIdx && order.Status !== "REFUNDED";
                const current = order.Status === s.key;
                return (
                  <div key={s.key} className="flex items-center gap-3 relative z-10 mb-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                      done 
                        ? "bg-emerald-500" 
                        : current 
                        ? "bg-purple-600 ring-4 ring-purple-500/25 text-white" 
                        : "bg-white/[0.04] text-slate-500 border border-white/[0.06]"
                    }`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : i + 1}
                    </div>
                    <span className={`text-xs font-semibold ${current ? "text-white font-bold" : done ? "text-slate-300" : "text-slate-600"}`}>
                      {s.label}
                    </span>
                    {current && (
                      <span className="ml-auto text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5 font-bold uppercase tracking-wider">
                        Active Stage
                      </span>
                    )}
                  </div>
                );
              })}
              {order.Status === "REFUNDED" && (
                <div className="flex items-center gap-3 mt-1 relative z-10">
                  <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center flex-shrink-0">
                    <X className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-rose-400 text-xs font-bold uppercase tracking-wider">Refund Completed</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showEditAsset && (
        <EditAssetModal
          assetId={order.AssetId}
          onClose={() => setShowEditAsset(false)}
          onUpdated={() => { /* maybe refresh */ }}
        />
      )}
    </div>
  );
}

// ===================== Creative Orders Sub-tab =====================
function CreativeOrdersSubTab({ artists }: { artists: Artist[] }) {
  const [orders, setOrders] = useState<CreativeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CreativeOrder | null>(null);
  const [assignModal, setAssignModal] = useState<CreativeOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchOrders = () => {
    setLoading(true); setError("");
    apiFetch("/orders")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setOrders(d.data ?? d))
      .catch(() => setError("Cannot load creative orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOrderUpdated = (updated: CreativeOrder) => {
    setOrders((prev) => prev.map((o) => o.OrderId === updated.OrderId ? updated : o));
    if (selected?.OrderId === updated.OrderId) setSelected(updated);
  };

  if (selected) {
    return (
      <CreativeOrderDetail
        order={selected} artists={artists}
        onBack={() => setSelected(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    );
  }

  const filtered = filterStatus === "ALL" ? orders : orders.filter(o => o.Status === filterStatus);
  const newCount = orders.filter(o => o.Status === "NEW").length;

  return (
    <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
      <CardHeader className="border-b border-white/[0.06] pb-4 bg-white/[0.01]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400 shrink-0" />
              Creative Order Dispatching
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Audit custom briefs, dispatch to artists, and track production lifecycles
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {newCount > 0 && (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                {newCount} unassigned
              </Badge>
            )}
            <Button onClick={fetchOrders} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02]" disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {["ALL", "NEW", "IN_PRODUCTION", "REVIEW", "COMPLETED", "DELIVERED", "CANCELLED"].map((s) => {
            const label = s === "ALL" ? "All Briefs" : STATUS_CONFIG[s]?.label ?? s;
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  active
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "border-white/[0.06] bg-white/[0.01] text-slate-400 hover:border-slate-500"
                }`}
              >
                {label}
                {s !== "ALL" && (
                  <span className="ml-1 opacity-50">({orders.filter(o => o.Status === s).length})</span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-rose-400 text-xs">{error}</p>
            <Button onClick={fetchOrders} variant="outline" className="border-white/[0.08] text-slate-300">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
            <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-semibold">No active creative orders registered</p>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
            {filtered.map((order) => (
              <div
                key={order.OrderId}
                className="flex items-center justify-between p-4 rounded-xl bg-[#080d1a]/50 border border-white/[0.04] hover:border-blue-500/20 hover:bg-[#0d1324]/40 transition-all gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-white font-semibold text-sm truncate">
                    {order.ProductName ?? `Creative Order #${order.OrderId}`}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 font-medium">
                    <span className="font-mono text-[10px] text-slate-400">#{order.OrderId}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {order.BuyerName || order.CompanyName || `Company #${order.CompanyId}`}
                    </span>
                    {order.PackageName && (
                      <>
                        <span>·</span>
                        <span>{order.PackageName}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>Created {new Date(order.CreatedAt).toLocaleDateString()}</span>
                    {order.Deadline && (
                      <>
                        <span>·</span>
                        <span className="text-amber-400 font-semibold">Due {new Date(order.Deadline).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[order.Status]?.color ?? "bg-slate-600"}`}>
                    {STATUS_CONFIG[order.Status]?.label}
                  </span>
                  <Button size="sm" variant="outline" className="border-white/[0.08] hover:border-blue-500/30 hover:bg-blue-500/5 text-slate-300 hover:text-blue-400 rounded-xl h-8 text-xs font-bold"
                    onClick={() => setSelected(order)}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  {order.Status === "NEW" && (
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl h-8 text-xs font-bold"
                      onClick={() => setAssignModal(order)}>
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Dispatch
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {assignModal && (
        <AssignTaskModal
          order={assignModal} artists={artists}
          onClose={() => setAssignModal(null)}
          onAssigned={(updated) => { handleOrderUpdated(updated); setAssignModal(null); }}
        />
      )}
    </Card>
  );
}

// ===================== Marketplace Orders Sub-tab =====================
function MarketplaceOrdersSubTab() {
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<MarketplaceOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchOrders = () => {
    setLoading(true); setError("");
    apiFetch("/marketplace-orders")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setOrders(d.data ?? d))
      .catch((e) => setError(`Cannot load marketplace orders. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleOrderUpdated = (updated: MarketplaceOrder) => {
    setOrders((prev) => prev.map((o) => o.MpOrderId === updated.MpOrderId ? updated : o));
    if (selected?.MpOrderId === updated.MpOrderId) setSelected(updated);
  };

  if (selected) {
    return (
      <MarketplaceOrderDetail
        order={selected}
        onBack={() => setSelected(null)}
        onOrderUpdated={handleOrderUpdated}
      />
    );
  }

  const filtered = filterStatus === "ALL" ? orders : orders.filter(o => o.Status === filterStatus);
  const pendingCount = orders.filter(o => o.Status === "PENDING").length;
  const totalRevenue = orders.filter(o => o.Status === "PAID" || o.Status === "DELIVERED")
    .reduce((s, o) => s + (o.Price ?? 0), 0);

  return (
    <Card className="bg-[#0d1324]/50 border-white/[0.06] backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg">
      <CardHeader className="border-b border-white/[0.06] pb-4 bg-white/[0.01]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-white text-base font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-400 shrink-0" />
              Marketplace Store Transactions
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Audit automated store downloads, monitor payments, and process refund actions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                {pendingCount} pending
              </Badge>
            )}
            <Button onClick={fetchOrders} variant="outline" size="sm" className="border-white/[0.08] text-slate-300 hover:bg-white/[0.02]" disabled={loading}>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Stats grid */}
        {orders.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: "Total Purchases", value: orders.length, color: "text-white" },
              { label: "Awaiting Clearance", value: orders.filter(o => o.Status === "PENDING").length, color: "text-amber-400" },
              { label: "Delivered Keys", value: orders.filter(o => o.Status === "DELIVERED").length, color: "text-cyan-400" },
              { label: "Store Gross Income", value: `${totalRevenue.toLocaleString("vi-VN")} ₫`, color: "text-emerald-400 font-bold" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#080d1a]/50 rounded-xl p-3 border border-white/[0.04] text-center min-w-0">
                <p className="text-slate-500 text-[9px] uppercase tracking-wider mb-1 font-bold truncate">{label}</p>
                <p className={`font-extrabold text-sm truncate ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {["ALL", "PENDING", "PAID", "DELIVERED", "REFUNDED"].map((s) => {
            const label = s === "ALL" ? "All Receipts" : MP_STATUS_CONFIG[s]?.label ?? s;
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-bold ${
                  active
                    ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/10"
                    : "border-white/[0.06] bg-white/[0.01] text-slate-400 hover:border-slate-500"
                }`}
              >
                {label}
                {s !== "ALL" && (
                  <span className="ml-1 opacity-50">({orders.filter(o => o.Status === s).length})</span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-rose-400 text-xs">{error}</p>
            <Button onClick={fetchOrders} variant="outline" className="border-white/[0.08] text-slate-300">Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/[0.06] rounded-2xl">
            <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-semibold">No store transactions logged</p>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar">
            {filtered.map((order) => {
              const cfg = MP_STATUS_CONFIG[order.Status] ?? { label: order.Status, color: "bg-slate-600/10 text-slate-300 border-slate-500/20" };
              return (
                <div
                  key={order.MpOrderId}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#080d1a]/50 border border-white/[0.04] hover:border-purple-500/20 hover:bg-[#0d1324]/40 transition-all gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <p className="text-white font-semibold text-sm truncate">
                        {order.AssetName ?? `Catalog Asset #${order.AssetId}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 font-medium">
                      <span className="font-mono text-[10px] text-slate-400">Order #{order.MpOrderId}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {order.BuyerName || (order.BuyerCompanyName ?? `Buyer #${order.BuyerCompanyId}`)}
                      </span>
                      {order.Price != null && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-400 font-semibold">
                            {order.Price.toLocaleString("vi-VN")} ₫
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {new Date(order.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <Button size="sm" variant="outline" className="border-white/[0.08] hover:border-purple-500/30 hover:bg-purple-500/5 text-slate-300 hover:text-purple-400 rounded-xl h-8 text-xs font-bold"
                      onClick={() => setSelected(order)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================== Main OrdersTab =====================
export function OrdersTab({ artists }: { artists: Artist[] }) {
  const [subTab, setSubTab] = useState<"creative" | "marketplace">("creative");

  return (
    <div className="space-y-5">
      {/* Sub-tab switcher */}
      <div className="flex gap-1.5 p-1 bg-[#0d1324]/50 border border-white/[0.06] rounded-xl w-fit relative">
        <button
          onClick={() => setSubTab("creative")}
          className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer ${
            subTab === "creative" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {subTab === "creative" && (
            <motion.div
              layoutId="activeSubTabIndicator"
              className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <Package className="w-4 h-4 relative z-10 shrink-0" />
          <span className="relative z-10">Creative Orders</span>
        </button>
        <button
          onClick={() => setSubTab("marketplace")}
          className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer ${
            subTab === "marketplace" ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {subTab === "marketplace" && (
            <motion.div
              layoutId="activeSubTabIndicator"
              className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
          <ShoppingBag className="w-4 h-4 relative z-10 shrink-0" />
          <span className="relative z-10">Marketplace Orders</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === "creative" ? (
            <CreativeOrdersSubTab artists={artists} />
          ) : (
            <MarketplaceOrdersSubTab />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}