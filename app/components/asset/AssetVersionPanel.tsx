"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Eye, FileBox, Package, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/app/components/ui/button";
import dynamic from "next/dynamic";
import AssetVersionUploader, { type UploadedVersion } from "./AssetVersionUploader";

// Lazy-load the heavy Three.js viewer
const OBJModelViewer = dynamic(() => import("@/app/components/3d/OBJModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] bg-slate-900/50 rounded-2xl flex items-center justify-center border border-white/[0.06]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-5 h-5 border-2 border-slate-700 border-t-purple-400 rounded-full animate-spin" />
        <span className="text-xs text-slate-500 uppercase tracking-widest">Initializing Viewer...</span>
      </div>
    </div>
  ),
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface AssetVersionPanelProps {
  assetId: number;
  /** Show the upload section (manager/artist only) */
  allowUpload?: boolean;
  /** If true, panel starts collapsed */
  defaultCollapsed?: boolean;
  className?: string;
}

// ─── Format badge colors ──────────────────────────────────────────────────────
const FORMAT_COLORS: Record<string, string> = {
  GLB:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  OBJ:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  FBX:  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  USDZ: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  WEBAR:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

// ─── 3D-capable formats ───────────────────────────────────────────────────────
const RENDERABLE_FORMATS = new Set(["GLB", "OBJ"]);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AssetVersionPanel({
  assetId,
  allowUpload = false,
  defaultCollapsed = false,
  className = "",
}: AssetVersionPanelProps) {
  const [versions, setVersions] = useState<UploadedVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Preview state
  const [previewVersion, setPreviewVersion] = useState<UploadedVersion | null>(null);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // ── Fetch versions ──────────────────────────────────────────────────────────
  const fetchVersions = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiFetch(`/asset-versions/${assetId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const list: UploadedVersion[] = data.data ?? data;
      // Newest first
      setVersions(list.sort((a, b) => b.VersionId - a.VersionId));
    } catch (e: any) {
      setError(`Cannot load versions. (${e.message})`);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  // ── Preview a version ───────────────────────────────────────────────────────
  const handlePreview = async (v: UploadedVersion) => {
    if (previewVersion?.VersionId === v.VersionId) {
      setPreviewVersion(null); setPreviewData(null);
      return;
    }
    setPreviewVersion(v); setPreviewData(null); setLoadingPreview(true);
    try {
      // If Base64Data already in version object, use it directly
      if (v.Base64Data) {
        setPreviewData(v.Base64Data);
        return;
      }
      // Otherwise fetch the full version detail
      const res = await apiFetch(`/asset-versions/${assetId}`);
      if (!res.ok) throw new Error("Cannot fetch version data");
      const data = await res.json();
      const list: UploadedVersion[] = data.data ?? data;
      const full = list.find(x => x.VersionId === v.VersionId);
      setPreviewData(full?.Base64Data ?? null);
    } catch {
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  // ── On new upload, prepend to list ─────────────────────────────────────────
  const handleUploaded = (version: UploadedVersion) => {
    setVersions(prev => [version, ...prev]);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`bg-[#0d1324]/60 border border-white/[0.06] rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <FileBox className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-white text-sm font-bold tracking-tight">3D Asset Versions</span>
          {versions.length > 0 && (
            <span className="ml-1 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2 py-0.5 rounded-full">
              {versions.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); fetchVersions(); }}
            className="text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-slate-500" />
            : <ChevronUp className="w-4 h-4 text-slate-500" />
          }
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Upload zone (manager/artist only) */}
          {allowUpload && (
            <AssetVersionUploader
              assetId={assetId}
              onUploaded={handleUploaded}
            />
          )}

          {/* Version List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-rose-400 text-xs text-center py-6">{error}</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/[0.06] rounded-xl">
              <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-semibold">No versions uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v, idx) => {
                const isPreviewOpen = previewVersion?.VersionId === v.VersionId;
                const isRenderable = RENDERABLE_FORMATS.has(v.FileFormat);
                const formatColor = FORMAT_COLORS[v.FileFormat] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";

                return (
                  <div key={v.VersionId} className="rounded-xl border border-white/[0.06] overflow-hidden">
                    {/* Row */}
                    <div className="flex items-center justify-between gap-3 px-3.5 py-3 bg-[#080d1a]/50">
                      {/* Left */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <FileBox className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-white text-xs font-semibold truncate">
                              {v.FileUrl ?? `Version #${v.VersionId}`}
                            </p>
                            {idx === 0 && (
                              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${formatColor}`}>
                              {v.FileFormat}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(v.CreatedAt).toLocaleDateString("vi-VN")}{" "}
                              {new Date(v.CreatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {v.PolyCount != null && v.PolyCount > 0 && (
                              <span className="text-[10px] text-slate-500">{v.PolyCount.toLocaleString()} polys</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Preview button */}
                      {isRenderable && (
                        <Button
                          size="sm"
                          variant={isPreviewOpen ? "default" : "outline"}
                          className={`shrink-0 h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all ${
                            isPreviewOpen
                              ? "bg-purple-600 border-purple-600 text-white"
                              : "border-white/[0.08] text-slate-300 hover:border-purple-500/40 hover:text-purple-300"
                          }`}
                          onClick={() => handlePreview(v)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {isPreviewOpen ? "Hide" : "Preview 3D"}
                        </Button>
                      )}
                    </div>

                    {/* Inline 3D Preview */}
                    {isPreviewOpen && (
                      <div className="border-t border-white/[0.06] bg-[#050912] p-4">
                        {loadingPreview ? (
                          <div className="flex items-center justify-center h-[300px]">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
                              <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Loading model...</span>
                            </div>
                          </div>
                        ) : previewData ? (
                          <>
                            <OBJModelViewer objData={previewData} />
                            <p className="text-center text-[10px] text-slate-600 mt-2">
                              Drag to rotate · Scroll to zoom · Right-click to pan
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-[200px] text-slate-500 text-xs">
                            Preview data not available for this version.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
