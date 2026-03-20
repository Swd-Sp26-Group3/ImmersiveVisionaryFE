"use client";
import { useEffect, useState } from "react";
import {
  Loader2, AlertCircle, RefreshCw, Plus, Box, Send, Clock,
  ShoppingBag, ArrowRight, Sparkles, X, Upload, Eye
} from "lucide-react";
import DynamicOBJModelViewer from "@/app/components/3d/OBJModelViewer";
import { Button } from "@/app/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Asset, PUBLISH_CONFIG, CATEGORY_IMAGES } from "./types";

// ── Upload Modal ─────────────────────────────────────────────────────
function UploadAssetModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    AssetName: "", Description: "", Category: "",
    Industry: "", Price: "", PreviewImage: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
  });

  const handleSave = async () => {
    if (!form.AssetName.trim()) { setError("Asset name is required."); return; }
    if (!file) { setError("Please upload a .obj file."); return; }

    setSaving(true); setError("");
    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await apiFetch("/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AssetName: form.AssetName,
          Description: form.Description || null,
          Category: form.Category || null,
          Industry: form.Industry || null,
          Price: form.Price ? Number(form.Price) : null,
          PreviewImage: form.PreviewImage || null,
          Base64Data: base64Data, // Save the actual file content
          AssetType: "MARKETPLACE",
          IsMarketplace: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Create failed");
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Save failed.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1526] border border-cyan-500/20 rounded-2xl w-full max-w-md shadow-2xl shadow-cyan-500/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-white font-semibold">Create New Asset</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {([
            { label: "Asset Name *", key: "AssetName", placeholder: "e.g. Luxury Bag 3D Model", type: "text" },
            { label: "Category", key: "Category", placeholder: "e.g. Fashion, Cosmetics", type: "text" },
            { label: "Industry", key: "Industry", placeholder: "e.g. Retail, Beauty", type: "text" },
            { label: "Price (VND)", key: "Price", placeholder: "e.g. 5000000", type: "number" },
            { label: "Preview Image URL", key: "PreviewImage", placeholder: "https://...", type: "text" },
          ] as const).map(({ label, key, placeholder, type }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-slate-300 text-xs font-medium">{label}</label>
              <input type={type} placeholder={placeholder} {...field(key)}
                className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition"
              />
            </div>
          ))}

          {/* OBJ File Upload */}
          <div className="space-y-1.5">
            <label className="text-slate-300 text-xs font-medium">3D Model (.OBJ) *</label>
            <div className="relative border border-dashed border-white/10 rounded-xl p-4 hover:border-cyan-500/40 transition group cursor-pointer">
              <input type="file" accept=".obj"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer" />
              <div className="flex flex-col items-center justify-center gap-1">
                <Upload className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition" />
                <p className="text-slate-400 text-xs truncate max-w-full px-2">
                  {file ? file.name : "Click to select .obj file"}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-300 text-xs font-medium">Description</label>
            <textarea rows={3} placeholder="Describe this 3D/AR asset..." {...field("Description")}
              className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition resize-none"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-3 py-2 border border-red-500/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-white/8">
          <Button onClick={onClose} variant="outline"
            className="flex-1 border-white/10 text-slate-400 hover:text-white rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/20">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {saving ? "Creating..." : "Create Asset"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Asset Card ───────────────────────────────────────────────────────
function AssetCard({
  asset,
  onSubmit,
  submitting,
}: {
  asset: Asset;
  onSubmit: (id: number) => void;
  submitting: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const pCfg = PUBLISH_CONFIG[asset.PublishStatus] ?? PUBLISH_CONFIG.DRAFT;
  const rawImg = asset.PreviewImage
    || CATEGORY_IMAGES[asset.Category ?? "default"]
    || CATEGORY_IMAGES.default;

  // Pre-check for known blocked domains to avoid console error spam (NotSameSite/CORP)
  const isBlocked = typeof rawImg === "string" && rawImg.includes("kyma.vn");
  const img = isBlocked ? (CATEGORY_IMAGES[asset.Category ?? "default"] || CATEGORY_IMAGES.default) : rawImg;

  return (
    <div className="bg-slate-900/40 border border-white/6 rounded-2xl overflow-hidden hover:border-cyan-500/20 transition-all group relative">
      <div className="aspect-video relative overflow-hidden">
        <img src={img} alt={asset.AssetName}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const fallback = CATEGORY_IMAGES[asset.Category ?? "default"] || CATEGORY_IMAGES.default;
            if (target.src !== fallback) target.src = fallback;
          }}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1526] via-transparent" />
        <span className={`absolute top-2.5 right-2.5 text-xs px-2 py-0.5 rounded-full border font-medium ${pCfg.bg} ${pCfg.color}`}>
          {pCfg.label}
        </span>
        {asset.Base64Data && (
          <button
            onClick={() => setShowPreview(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium gap-2"
          >
            <Eye className="w-4 h-4" /> Preview 3D
          </button>
        )}
      </div>

      <div className="p-4">
        <p className="text-white font-medium text-sm mb-1 truncate">{asset.AssetName}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          {asset.Category && <span>{asset.Category}</span>}
          {asset.Price != null && (
            <><span>·</span><span className="text-green-400">{asset.Price.toLocaleString("vi-VN")} ₫</span></>
          )}
        </div>

        {asset.PublishStatus === "DRAFT" && (
          <button onClick={() => onSubmit(asset.AssetId)} disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-medium rounded-xl hover:bg-yellow-500/25 transition disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit for Review
          </button>
        )}
        {asset.PublishStatus === "PENDING" && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/70 text-xs rounded-xl">
            <Clock className="w-3.5 h-3.5" /> Waiting for manager approval
          </div>
        )}
        {asset.PublishStatus === "PUBLISHED" && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl">
            <ShoppingBag className="w-3.5 h-3.5" /> Live on Marketplace
          </div>
        )}
        {asset.PublishStatus === "REJECTED" && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
            <AlertCircle className="w-3.5 h-3.5" /> Rejected — edit and resubmit
          </div>
        )}
        {isBlocked && (
          <p className="mt-2 text-[10px] text-yellow-500/60 leading-tight italic">
            Note: Original thumbnail blocked by source server security policy. Showed fallback.
          </p>
        )}
      </div>


      {showPreview && asset.Base64Data && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-[#0b1220] border border-cyan-500/20 rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-white font-medium">{asset.AssetName} - 3D Preview</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 h-[500px]">
              <DynamicOBJModelViewer objData={asset.Base64Data} />
            </div>
            <div className="p-4 bg-slate-900/50 text-center">
              <Button onClick={() => setShowPreview(false)} variant="ghost" className="text-slate-400">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Tab ─────────────────────────────────────────────────────────
export function AssetsTab() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);

  const fetchAssets = () => {
    setLoading(true); setError("");
    // GET /assets/my — artist thấy TẤT CẢ assets của mình (DRAFT, PENDING, PUBLISHED, REJECTED)
    apiFetch("/assets/my")
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { const arr = d.data ?? d; setAssets(Array.isArray(arr) ? arr : []); })
      .catch(e => setError(`Cannot load assets. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleSubmit = async (assetId: number) => {
    if (!confirm("Submit this asset for manager review? It will be locked until reviewed.")) return;
    setSubmitting(assetId);
    try {
      const res = await apiFetch(`/assets/${assetId}/submit`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Submit failed");
      setAssets(prev => prev.map(a =>
        a.AssetId === assetId ? { ...a, PublishStatus: "PENDING" } : a
      ));
    } catch (e: any) {
      alert(e.message ?? "Submit failed.");
    } finally { setSubmitting(null); }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Flow indicator */}
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4">
          <p className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Asset Publication Flow
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {(["Create Asset", "Submit for Review", "Manager Approves", "Live on Marketplace"] as const)
              .map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full border ${i === 0 ? "border-slate-600 text-slate-400" :
                    i === 1 ? "border-yellow-500/30 text-yellow-400" :
                      i === 2 ? "border-purple-500/30 text-purple-400" :
                        "border-green-500/30 text-green-400"
                    }`}>{step}</span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700" />}
                </div>
              ))
            }
          </div>
        </div>

        {/* Card container */}
        <div className="bg-[#0d1526] border border-white/8 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" /> My 3D/AR Assets
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Create → submit to manager → publish to marketplace
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAssets}
                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20">
                <Plus className="w-4 h-4" /> New Asset
              </button>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
                <button onClick={fetchAssets} className="text-slate-400 hover:text-white text-sm">Retry</button>
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-16">
                <Box className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 font-medium mb-1">No assets yet</p>
                <p className="text-slate-600 text-sm mb-5">
                  Create your first 3D/AR asset to sell on marketplace
                </p>
                <button onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-xl hover:from-cyan-400 hover:to-blue-500 transition">
                  <Plus className="w-4 h-4" /> Create First Asset
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(asset => (
                  <AssetCard
                    key={asset.AssetId}
                    asset={asset}
                    onSubmit={handleSubmit}
                    submitting={submitting === asset.AssetId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <UploadAssetModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAssets(); }}
        />
      )}
    </>
  );
}