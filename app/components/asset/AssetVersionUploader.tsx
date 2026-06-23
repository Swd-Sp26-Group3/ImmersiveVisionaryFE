"use client";
import React, { useState, useCallback, useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle, FileBox, X } from "lucide-react";
import { apiFetch, getApiBaseUrl, process3DModelFiles, blobToBase64, getFilesFromDroppedItems, uploadAssetInChunks } from "@/lib/api";
import { Button } from "@/app/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface UploadedVersion {
  VersionId: number;
  AssetId: number;
  FileFormat: string;
  FileUrl: string | null;
  PolyCount: number | null;
  TextureSize: string | null;
  CreatedAt: string;
  Base64Data?: string | null;
}

interface AssetVersionUploaderProps {
  assetId: number;
  /** Called after a successful upload with the new version data */
  onUploaded?: (version: UploadedVersion) => void;
  /** Compact mode — shows just a drop zone, no version list */
  compact?: boolean;
  className?: string;
}

// ─── FileFormat detection ─────────────────────────────────────────────────────
const FILE_FORMAT_MAP: Record<string, string> = {
  glb: "GLB", gltf: "GLB",
  fbx: "FBX",
  usdz: "USDZ",
  obj: "OBJ", blend: "OBJ",
};

function detectFileFormat(files: File[], prefix: string): string {
  const mainFile = files.find(f => {
    const ext = f.name.toLowerCase().split(".").pop() ?? "";
    return Object.keys(FILE_FORMAT_MAP).includes(ext);
  }) ?? files[0];
  const ext = mainFile.name.toLowerCase().split(".").pop() ?? "";
  return FILE_FORMAT_MAP[ext] ?? "OBJ";
}

// ─── Upload state per-session ─────────────────────────────────────────────────
interface UploadItem {
  id: string;
  fileName: string;
  status: "uploading" | "done" | "error";
  progress?: number;
  error?: string;
  version?: UploadedVersion;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AssetVersionUploader({
  assetId,
  onUploaded,
  compact = false,
  className = "",
}: AssetVersionUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // ── Core upload logic ──────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;

    const itemId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const displayName = files.length > 1
      ? `${files[0].name} (+${files.length - 1} more)`
      : files[0].name;

    setItems(prev => [...prev, {
      id: itemId,
      fileName: displayName,
      status: "uploading",
      progress: 0,
    }]);

    try {
      // 1. Process → zip if multi-file, raw if single
      const processedModel = await process3DModelFiles(files);
      
      let fileName = files[0].name;
      if (processedModel.prefix === "zip") {
        fileName = fileName.toLowerCase().endsWith(".zip") ? fileName : `${fileName}.zip`;
      }

      // 2. Upload the model file in chunks
      const { uploadId } = await uploadAssetInChunks(
        fileName,
        processedModel,
        (progress) => {
          setItems(prev => prev.map(it => 
            it.id === itemId ? { ...it, progress } : it
          ));
        }
      );

      // 3. Detect FileFormat
      const fileFormat = detectFileFormat(files, processedModel.prefix);

      // 4. POST to backend — direct VPS URL to bypass Vercel 4.5MB limit
      const res = await apiFetch(`${getApiBaseUrl()}/api/asset-versions/${assetId}`, {
        method: "POST",
        body: JSON.stringify({
          FileFormat: fileFormat,
          FileUrl: displayName,
          UploadId: uploadId,
          PolyCount: 0,
          TextureSize: "Unknown",
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed [${res.status}]: ${errText}`);
      }

      const data = await res.json();
      const version: UploadedVersion = data.data ?? data;

      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, status: "done", version } : it
      ));
      onUploaded?.(version);
    } catch (err: any) {
      setItems(prev => prev.map(it =>
        it.id === itemId ? { ...it, status: "error", error: err.message ?? "Upload failed." } : it
      ));
    }
  }, [assetId, onUploaded]);

  // ── Drag & drop handlers ───────────────────────────────────────────────────
  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = await getFilesFromDroppedItems(e.dataTransfer);
    if (files.length) uploadFiles(files);
  }, [uploadFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) uploadFiles(files);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }, [uploadFiles]);

  const dismissItem = (id: string) =>
    setItems(prev => prev.filter(it => it.id !== id));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer select-none
          ${isDragging
            ? "border-purple-500 bg-purple-500/10 scale-[1.01]"
            : "border-white/[0.08] bg-white/[0.01] hover:border-purple-500/40 hover:bg-purple-500/5"
          }
          ${compact ? "p-4" : "p-6"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".obj,.mtl,.zip,.glb,.gltf,.fbx,.usdz,.png,.jpg,.jpeg"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
          {...{ webkitdirectory: "", directory: "" } as any}
        />
        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
          <Upload className={`text-slate-400 ${compact ? "w-5 h-5" : "w-7 h-7"}`} />
          <p className={`text-white font-semibold ${compact ? "text-xs" : "text-sm"}`}>
            {isDragging ? "Drop files here..." : (
              <>
                Click/drag to upload, or{" "}
                <span 
                  className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                >
                  upload folder
                </span>
              </>
            )}
          </p>
          {!compact && (
            <p className="text-[10px] text-slate-500 mt-0.5">
              OBJ · GLB · FBX · USDZ · ZIP archive (multi-file)
            </p>
          )}
        </div>
      </div>

      {/* Upload Item List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border text-xs font-medium transition-all
                ${item.status === "done"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : item.status === "error"
                    ? "bg-rose-500/5 border-rose-500/20"
                    : "bg-white/[0.02] border-white/[0.06]"
                }`}
            >
              {/* Icon */}
              <div className="mt-0.5 shrink-0">
                {item.status === "uploading" && (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                )}
                {item.status === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {item.status === "error" && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`truncate font-semibold ${
                  item.status === "done" ? "text-emerald-300"
                  : item.status === "error" ? "text-rose-300"
                  : "text-slate-300"
                }`}>
                  {item.fileName}
                </p>
                {item.status === "uploading" && (
                  <p className="text-slate-500 mt-0.5">
                    Processing &amp; uploading... {item.progress !== undefined ? `${item.progress}%` : ""}
                  </p>
                )}
                {item.status === "done" && item.version && (
                  <p className="text-slate-500 mt-0.5">
                    Version #{item.version.VersionId} · {item.version.FileFormat} · Uploaded{" "}
                    {new Date(item.version.CreatedAt).toLocaleTimeString()}
                  </p>
                )}
                {item.status === "error" && (
                  <p className="text-rose-400/80 mt-0.5 break-words">{item.error}</p>
                )}
              </div>

              {/* Dismiss */}
              {item.status !== "uploading" && (
                <button
                  onClick={e => { e.stopPropagation(); dismissItem(item.id); }}
                  className="text-slate-600 hover:text-slate-300 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
