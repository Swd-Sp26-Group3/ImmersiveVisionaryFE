"use client";
import { useEffect, useState } from "react";
import {
  Loader2, Plus, Box, Send, Clock,
  ShoppingBag, ArrowRight, Sparkles, X, Upload, Eye, AlertCircle, RefreshCw, ImagePlus,
} from "lucide-react";
import JSZip from "jszip";
import DynamicOBJModelViewer from "@/app/components/3d/OBJModelViewer";
import { Button } from "@/app/components/ui/button";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { EmptyState } from "@/app/components/ui/empty-state";
import { ErrorState } from "@/app/components/ui/error-state";
import { StatusBadge } from "@/app/components/ui/status-badge";
import { Modal } from "@/app/components/ui/modal";
import { useConfirm } from "@/app/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api";
import { Asset, PUBLISH_CONFIG, CATEGORY_IMAGES } from "./types";
import { toast } from "sonner";

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadAssetModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    AssetName: "", Description: "", Category: "",
    Industry: "", Price: "", PreviewImage: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewImgFile, setPreviewImgFile] = useState<File | null>(null);
  const [previewImgDataUrl, setPreviewImgDataUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  // Khi user chọn ảnh preview → nén ảnh bằng Canvas trước khi convert sang Base64
  const handlePreviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const imgFile = e.target.files?.[0];
    if (!imgFile) return;
    setPreviewImgFile(imgFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Khởi tạo Canvas để resize và nén ảnh
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        // Tính toán tỉ lệ scale giữ nguyên aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Nén thành định dạng JPEG chất lượng 70%
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setPreviewImgDataUrl(compressedDataUrl);
          setForm((p) => ({ ...p, PreviewImage: compressedDataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(imgFile);
  };

  /** Gzip-compress a File and return "gzip:<base64>" string.
   *  .obj files are plain text → gzip shrinks them 70-90%, keeping
   *  the payload well under the 65535-byte TDS mssql packet limit. */
  const compressFileToGzipBase64 = async (f: File): Promise<string> => {
    const arrayBuf = await f.arrayBuffer();
    const cs = new CompressionStream("gzip");
    const writer = cs.writable.getWriter();
    writer.write(new Uint8Array(arrayBuf) as any);
    writer.close();
    const compressed = await new Response(cs.readable).arrayBuffer();
    // Convert compressed bytes → base64
    const bytes = new Uint8Array(compressed);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
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

  const handleSave = async () => {
    if (!form.AssetName.trim()) { setError("Asset name is required."); return; }
    if (selectedFiles.length === 0) { setError("Please upload 3D model files."); return; }
    setSaving(true);
    setError("");
    try {
      const base64Data = await process3DModelFiles(selectedFiles);

      // Always route through the Edge proxy at /api/proxy/assets.
      // This runs server-side on Vercel (no CORS) and streams the body
      // without Vercel's 4.5 MB rewrite limit. Works on localhost too.
      const res = await apiFetch("/proxy/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          AssetName:    form.AssetName,
          Description:  form.Description  || null,
          Category:     form.Category     || null,
          Industry:     form.Industry     || null,
          Price:        form.Price ? Number(form.Price) : null,
          PreviewImage: form.PreviewImage || null,
          Base64Data:   base64Data,
          AssetType:    "MARKETPLACE",
          IsMarketplace: true,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json();
        const detail = [errBody.message, errBody.error, errBody.detail].filter(Boolean).join(' | ');
        throw new Error(detail || "Create failed");
      }
      toast.success("Asset created successfully!");
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // PreviewImage đã tách ra thành file picker riêng, không còn trong TEXT_FIELDS
  const TEXT_FIELDS = [
    { label: "Asset Name *", key: "AssetName", placeholder: "e.g. Luxury Bag 3D Model", type: "text"   },
    { label: "Category",     key: "Category",  placeholder: "e.g. Fashion, Cosmetics",  type: "text"   },
    { label: "Industry",     key: "Industry",  placeholder: "e.g. Retail, Beauty",       type: "text"   },
    { label: "Price (VND)",  key: "Price",     placeholder: "e.g. 5000000",              type: "number" },
  ] as const;

  return (
    <Modal
      open
      onClose={onClose}
      title={<span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400" /> Create New Asset</span>}
      maxWidth="md"
      footer={
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1 border-white/10 text-slate-400 hover:text-white rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 text-white rounded-xl font-semibold" style={{ background: "var(--gradient-accent)" }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : <><Plus className="w-4 h-4 mr-2" />Create Asset</>}
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
        {TEXT_FIELDS.map(({ label, key, placeholder, type }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-slate-300 text-xs font-medium">{label}</label>
            <input type={type} placeholder={placeholder} {...field(key)}
              className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition" />
          </div>
        ))}
        {/* Preview Image — file picker, đọc ra data URL, KHÔNG dùng Base64Data */}
        <div className="space-y-1.5">
          <label className="text-slate-300 text-xs font-medium">Preview Image</label>
          <div className="relative border border-dashed border-white/10 rounded-xl overflow-hidden hover:border-purple-500/40 transition group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handlePreviewImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            {previewImgDataUrl ? (
              <div className="relative h-28">
                <img src={previewImgDataUrl} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <ImagePlus className="w-5 h-5 text-white" />
                  <p className="text-white text-xs font-medium">Đổi ảnh</p>
                </div>
                <span className="absolute bottom-1.5 right-2 text-[10px] text-white/60 font-mono">{previewImgFile?.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1.5 py-5">
                <ImagePlus className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition" />
                <p className="text-slate-400 text-xs">Chọn ảnh thumbnail từ máy</p>
                <p className="text-slate-600 text-[10px]">PNG, JPG, WEBP...</p>
              </div>
            )}
          </div>
        </div>

        {/* 3D Model file */}
        <div className="space-y-1.5">
          <label className="text-slate-300 text-xs font-medium">3D Model Files (.OBJ, .MTL, Textures, or ZIP) *</label>
          <div className="relative border border-dashed border-white/10 rounded-xl p-4 hover:border-cyan-500/40 transition group cursor-pointer">
            <input
              type="file"
              accept=".obj,.mtl,.zip,.png,.jpg,.jpeg"
              multiple
              onChange={(e) => {
                const fileList = e.target.files ? Array.from(e.target.files) : [];
                setSelectedFiles(fileList);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center gap-1">
              <Upload className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition" />
              <p className="text-slate-400 text-xs truncate max-w-full px-2 text-center">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected: ${selectedFiles.map(f => f.name).join(', ')}`
                  : "Click to select .obj, .mtl, textures or a .zip archive"}
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-slate-300 text-xs font-medium">Description</label>
          <textarea rows={3} placeholder="Describe this 3D/AR asset..." {...field("Description")}
            className="w-full px-3 py-2.5 bg-slate-900/60 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 transition resize-none" />
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-3 py-2 border border-red-500/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Asset Card — lazy-loads Base64Data only when "Preview 3D" is clicked ──────
function AssetCard({ asset, onSubmit, submitting, onPreview }: {
  asset: Asset;
  onSubmit: (id: number) => void;
  submitting: boolean;
  onPreview: (asset: Asset) => void;
}) {
  const pCfg = PUBLISH_CONFIG[asset.PublishStatus] ?? PUBLISH_CONFIG.DRAFT;
  const rawImg = asset.PreviewImage || CATEGORY_IMAGES[asset.Category ?? "default"] || CATEGORY_IMAGES.default;
  const isBlocked = typeof rawImg === "string" && rawImg.includes("kyma.vn");
  const img = isBlocked ? (CATEGORY_IMAGES[asset.Category ?? "default"] || CATEGORY_IMAGES.default) : rawImg;

  return (
    <div className="bg-slate-900/40 border border-white/[0.06] rounded-2xl overflow-hidden hover:border-cyan-500/20 transition-all group relative">
      {/* Thumbnail */}
      <div className="aspect-video relative overflow-hidden">
        <img
          src={img}
          alt={asset.AssetName}
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            const fallback = CATEGORY_IMAGES[asset.Category ?? "default"] || CATEGORY_IMAGES.default;
            if (t.src !== fallback) t.src = fallback;
          }}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-2)] via-transparent" />
        <StatusBadge status={asset.PublishStatus} config={PUBLISH_CONFIG} className="absolute top-2.5 right-2.5" />

        {/* Preview 3D button — triggers lazy load */}
        <button
          onClick={() => onPreview(asset)}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium gap-2"
        >
          <Eye className="w-4 h-4" /> Preview 3D
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-white font-medium text-sm mb-1 truncate">{asset.AssetName}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          {asset.Category && <span>{asset.Category}</span>}
          {asset.Price != null && (
            <><span>·</span><span className="text-green-400">{asset.Price.toLocaleString("vi-VN")} ₫</span></>
          )}
        </div>

        {/* Status action */}
        {asset.PublishStatus === "DRAFT" && (
          <button onClick={() => onSubmit(asset.AssetId)} disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 text-xs font-medium rounded-xl hover:bg-yellow-500/25 transition disabled:opacity-50">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit for Review
          </button>
        )}
        {asset.PublishStatus === "PENDING" && (
          <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/70 text-xs rounded-xl">
            <Clock className="w-3.5 h-3.5" /> Waiting for approval
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
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
export function AssetsTab() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirm();

  const fetchAssets = () => {
    setLoading(true);
    setError("");
    apiFetch("/assets/my")
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { const arr = d.data ?? d; setAssets(Array.isArray(arr) ? arr : []); })
      .catch((e) => setError(`Cannot load assets. (${e.message})`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleSubmit = async (assetId: number) => {
    const ok = await confirm({
      title: "Submit Asset",
      message: "Submit this asset for manager review? It will be locked until reviewed.",
      confirmLabel: "Submit",
      variant: "warning",
    });
    if (!ok) return;
    setSubmitting(assetId);
    try {
      const res = await apiFetch(`/assets/${assetId}/submit`, { method: "PUT" });
      if (!res.ok) throw new Error((await res.json()).message ?? "Submit failed");
      setAssets((prev) => prev.map((a) => (a.AssetId === assetId ? { ...a, PublishStatus: "PENDING" } : a)));
      toast.success("Asset submitted for review!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Submit failed.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleOpen3D = async (asset: Asset) => {
    setPreviewAsset(asset);
    setPreviewData(null);
    setPreviewLoading(true);
    try {
      const res = await apiFetch(`/assets/${asset.AssetId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const b64 = (data.data ?? data).Base64Data ?? null;
      if (!b64) throw new Error("No 3D data found.");
      setPreviewData(b64);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load 3D model.");
      setPreviewAsset(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Publication flow */}
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4">
          <p className="text-slate-300 text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Asset Publication Flow
          </p>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {(["Create Asset", "Submit for Review", "Manager Approves", "Live on Marketplace"] as const).map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full border ${
                  i === 0 ? "border-slate-600 text-slate-400"
                  : i === 1 ? "border-yellow-500/30 text-yellow-400"
                  : i === 2 ? "border-purple-500/30 text-purple-400"
                  : "border-green-500/30 text-green-400"
                }`}>{step}</span>
                {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-700" />}
              </div>
            ))}
          </div>
        </div>

        {/* Card container */}
        <div className="bg-[var(--surface-2)] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" /> My 3D/AR Assets
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                3D preview loads on-demand — hover card &amp; click Preview 3D
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={fetchAssets}
                className="p-2 text-slate-400 hover:text-white transition rounded-lg hover:bg-white/5">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium rounded-xl transition shadow-lg"
                style={{ background: "var(--gradient-accent)", boxShadow: "0 4px 16px rgba(6,182,212,0.2)" }}>
                <Plus className="w-4 h-4" /> New Asset
              </button>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <LoadingSpinner size="md" color="cyan" fullPage />
            ) : error ? (
              <ErrorState message={error} onRetry={fetchAssets} />
            ) : assets.length === 0 ? (
              <EmptyState icon={Box} title="No assets yet"
                description="Create your first 3D/AR asset to sell on marketplace"
                action={
                  <button onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition"
                    style={{ background: "var(--gradient-accent)" }}>
                    <Plus className="w-4 h-4" /> Create First Asset
                  </button>
                }
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <AssetCard key={asset.AssetId} asset={asset}
                    onSubmit={handleSubmit} submitting={submitting === asset.AssetId}
                    onPreview={handleOpen3D} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <UploadAssetModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchAssets(); }} />
      )}

      {previewAsset && (
        <Modal
          open={!!previewAsset}
          onClose={() => { setPreviewAsset(null); setPreviewData(null); }}
          title={`${previewAsset.AssetName} — 3D Preview`}
          maxWidth="2xl"
        >
          <div className="p-6 h-[500px] flex items-center justify-center">
            {previewLoading ? (
              <div className="text-center">
                <LoadingSpinner size="lg" color="cyan" />
                <p className="text-slate-400 text-sm mt-3">Loading 3D model…</p>
              </div>
            ) : previewData ? (
              <DynamicOBJModelViewer objData={previewData} />
            ) : null}
          </div>
        </Modal>
      )}

      {ConfirmDialogComponent}
    </>
  );
}