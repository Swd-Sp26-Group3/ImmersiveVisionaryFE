"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Script from "next/script";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Smartphone } from "lucide-react";
import TVModelViewer from "../components/3d/TVModelViewer";
import OBJModelViewer from "../components/3d/OBJModelViewer";

// model-viewer is a custom HTML web component.
// React 19 dropped the global JSX namespace, so we cast to 'any' when rendering.
interface ModelViewerProps {
  src?: string;
  "ios-src"?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  "auto-rotate"?: boolean;
  "shadow-intensity"?: string;
  "shadow-softness"?: string;
  "environment-image"?: string;
  exposure?: string;
  "ar-scale"?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ModelViewer = React.forwardRef<any, ModelViewerProps>((props, ref) => {
  const El = "model-viewer" as any;
  return <El ref={ref} {...props} />;
});
ModelViewer.displayName = "ModelViewer";


// Helper function to extract filename with extension from any URL (including proxy URLs with query params)
const getFileNameFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("fileName") || url.split("/").pop() || "";
  } catch {
    return url.split("/").pop() || "";
  }
};


export default function ARViewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070518] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Đang khởi tạo AR Viewer...</p>
          </div>
        </div>
      }
    >
      <ARViewContent />
    </Suspense>
  );
}

function ARViewContent() {
  const searchParams = useSearchParams();
  const modelViewerRef = useRef<any>(null);
  const modelUrl = searchParams.get("model");
  const rawUsdzUrl = searchParams.get("usdz");

  // Dynamic parameters for AR lighting, shadows, and scaling to avoid hardcoding
  const environmentImage = searchParams.get("environmentImage") ?? "neutral";
  const shadowIntensity = searchParams.get("shadowIntensity") ?? "1.5";
  const shadowSoftness = searchParams.get("shadowSoftness") ?? "0.8";
  const exposure = searchParams.get("exposure") ?? "1.2";
  const arScale = searchParams.get("arScale") ?? "auto"; // Default to "auto" to allow pinch-to-zoom
  const label = searchParams.get("label") ?? "3D Model";

  // Process USDZ URL to configure scaling in native iOS Quick Look
  const usdzUrl = React.useMemo(() => {
    if (!rawUsdzUrl) return null;
    if (arScale === "fixed") {
      const suffix = "allowsContentScaling=0";
      if (rawUsdzUrl.includes("#")) {
        if (!rawUsdzUrl.includes("allowsContentScaling=")) {
          return `${rawUsdzUrl}&${suffix}`;
        }
        return rawUsdzUrl;
      }
      return `${rawUsdzUrl}#${suffix}`;
    }
    return rawUsdzUrl;
  }, [rawUsdzUrl, arScale]);

  const [objBase64, setObjBase64] = useState<string | null>(null);
  const [loadingModelData, setLoadingModelData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!modelUrl) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-white font-bold text-lg mb-2">Không tìm thấy Model</h1>
          <p className="text-slate-400 text-sm mb-6">URL model bị thiếu hoặc không hợp lệ.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // Detect format
  const resolvedFileName = getFileNameFromUrl(modelUrl) || searchParams.get("fileName") || "";
  const lowercaseFileName = resolvedFileName.toLowerCase();
  const lowercaseModelUrl = modelUrl.toLowerCase();

  const isCompatibleFormat =
    lowercaseModelUrl.includes(".glb") ||
    lowercaseModelUrl.includes(".gltf") ||
    lowercaseFileName.includes(".glb") ||
    lowercaseFileName.includes(".gltf");

  // Fallback to TV if format is incompatible
  const displayModelUrl = isCompatibleFormat ? modelUrl : "/tv.gltf";
  const isFallback = !isCompatibleFormat;

  // TV Model if it's explicitly the tv.gltf file OR if no modelUrl is provided
  const isTvModel = lowercaseModelUrl.includes("tv.gltf") || lowercaseFileName.includes("tv.gltf") || !modelUrl;

  const [isHttps, setIsHttps] = useState(true);

  // Check protocol and load custom model data if it's a customer order OBJ/ZIP model
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsHttps(window.location.protocol === "https:");
    }

    // Only load binary data if it's a custom model and is NOT in a compatible GLB/GLTF format (e.g. OBJ)
    if (!isTvModel && !isCompatibleFormat && modelUrl) {
      setLoadingModelData(true);
      setFetchError(null);
      fetch(modelUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            setObjBase64(base64);
            setLoadingModelData(false);
          };
          reader.onerror = () => {
            throw new Error("Lỗi đọc binary file");
          };
          reader.readAsDataURL(blob);
        })
        .catch((err) => {
          console.error("Failed to load model binary:", err);
          setFetchError("Không thể tải dữ liệu mô hình 3D từ máy chủ.");
          setLoadingModelData(false);
        });
    }
  }, [modelUrl, isTvModel, isCompatibleFormat]);

  // Apply custom hologram materials and scanline textures dynamically when model-viewer loads the model
  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    const handleLoad = async () => {
      try {
        if (!isTvModel || !mv.model || !mv.model.materials) return;

        // 1. Generate a wavy scanline pattern texture using an HTML5 Canvas dynamically
        // We write a 2D fBm noise function in JavaScript to match the Blender/WebGL shader nodes
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imgData = ctx.createImageData(256, 256);
          const data = imgData.data;

          const hash2D = (x: number, y: number) => {
            const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
            return h - Math.floor(h);
          };

          const noise2D = (x: number, y: number) => {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            const fx = x - ix;
            const fy = y - iy;

            const ux = fx * fx * (3.0 - 2.0 * fx);
            const uy = fy * fy * (3.0 - 2.0 * fy);

            const a = hash2D(ix, iy);
            const b = hash2D(ix + 1, iy);
            const c = hash2D(ix, iy + 1);
            const d = hash2D(ix + 1, iy + 1);

            return a * (1 - ux) * (1 - uy) +
                   b * ux * (1 - uy) +
                   c * (1 - ux) * uy +
                   d * ux * uy;
          };

          const fbm2D = (x: number, y: number) => {
            let v = 0.0;
            let a = 0.5;
            let sx = x;
            let sy = y;
            for (let i = 0; i < 2; i++) {
              v += a * noise2D(sx, sy);
              sx = sx * 2.0 + 10.0;
              sy = sy * 2.0 + 10.0;
              a *= 0.5;
            }
            return v;
          };

          const scale = 36.0;      // Controls wave density on the TV mesh
          const distortion = 0.8;  // Matches the Wave Texture distortion (wavy lines)

          for (let py = 0; py < 256; py++) {
            const v = py / 256;
            for (let px = 0; px < 256; px++) {
              const u = px / 256;
              // Distort coordinates using 2D fBm noise to get wavy, organic lines
              const noiseVal = fbm2D(u * 3.5, v * 3.5);
              const waveArg = v * scale + distortion * noiseVal * scale;
              const wave = 0.5 + 0.5 * Math.sin(waveArg * Math.PI * 2.0);

              const idx = (py * 256 + px) * 4;
              
              if (wave > 0.38) {
                // Keep pixel: White scanline mask (will be tinted by baseColorFactor)
                data[idx] = 255;     // R
                data[idx + 1] = 255; // G
                data[idx + 2] = 255; // B
                data[idx + 3] = 255; // A
              } else {
                // Discard pixel: Completely transparent gap
                data[idx] = 0;
                data[idx + 1] = 0;
                data[idx + 2] = 0;
                data[idx + 3] = 0;
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }

        const scanlineDataUrl = canvas.toDataURL("image/png");
        const scanlineTexture = await mv.createTexture(scanlineDataUrl);

        // 2. Traverses and modifies materials to render nicely in native AR viewers
        for (const material of mv.model.materials) {
          const name = material.name.toLowerCase();

          if (name === "tv") {
            // Apply scanlines to baseColorTexture
            if (material.pbrMetallicRoughness.baseColorTexture) {
              await material.pbrMetallicRoughness.baseColorTexture.setTexture(scanlineTexture);
            }
            // Apply scanlines to emissiveTexture
            if (material.emissiveTexture) {
              await material.emissiveTexture.setTexture(scanlineTexture);
            }

            // Set to BLEND mode since the texture itself now has the transparent gaps pre-calculated
            material.setAlphaMode("BLEND");

            // Set base color factor (Subtle cyan glass tint color matching TVHologramMaterial)
            material.pbrMetallicRoughness.setBaseColorFactor([0.0, 0.3, 0.5, 0.45]);
            material.pbrMetallicRoughness.setMetallicFactor(0.0);
            material.pbrMetallicRoughness.setRoughnessFactor(0.15);

            // Set emissive factor (glowing cyan color)
            material.setEmissiveFactor([0.0, 0.76, 1.0]);
          } else if (
            name.includes("material.005") ||
            name.includes("material.006") ||
            name.includes("material.007") ||
            name.includes("material.015")
          ) {
            // Surrounding neon rods: scale down emissive intensity (by 95%) to prevent blowout and allow opacity to blend
            const currentEmissive = material.emissiveFactor;
            if (currentEmissive) {
              material.setEmissiveFactor([
                currentEmissive[0] * 0.05,
                currentEmissive[1] * 0.05,
                currentEmissive[2] * 0.05,
              ]);
            }

            // Set to BLEND mode and make them highly transparent glass-like rods
            const currentBase = material.pbrMetallicRoughness.baseColorFactor;
            if (currentBase) {
              material.pbrMetallicRoughness.setBaseColorFactor([
                currentBase[0],
                currentBase[1],
                currentBase[2],
                0.35, // High transparency
              ]);
            }
            material.setAlphaMode("BLEND");
          }
        }
      } catch (err) {
        console.error("Failed to apply AR material modifications:", err);
      }
    };

    mv.addEventListener("load", handleLoad);
    return () => {
      mv.removeEventListener("load", handleLoad);
    };
  }, [displayModelUrl, isTvModel]);

  // Handler to trigger native AR camera mode from model-viewer
  const handleLaunchAR = () => {
    const mv = modelViewerRef.current;
    if (mv && typeof mv.activateAR === "function") {
      mv.activateAR();
    } else {
      alert("Thiết bị hoặc trình duyệt không hỗ trợ WebXR / AR QuickLook.");
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] overflow-hidden relative flex flex-col justify-between" style={{ background: "radial-gradient(circle at 50% 50%, #0d1530 0%, #050508 100%)" }}>
      {/* Load Google model-viewer web component via CDN */}
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* Floating Glassmorphic Top Header */}
      <div
        className="absolute top-4 left-4 right-4 z-20 p-4 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4"
        style={{
          marginTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
          >
            AR
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight truncate max-w-[170px] sm:max-w-xs">
              {isTvModel ? `${label} (TV Hologram)` : label}
            </h1>
            <p className="text-slate-400 text-[9px] uppercase tracking-wider font-semibold opacity-75 mt-0.5">3D / AR Preview</p>
          </div>
        </div>

        <Link
          href="/customer-dashboard"
          className="text-xs font-bold text-slate-300 hover:text-white transition-all bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại</span>
        </Link>
      </div>

      {/* Protocol warning if HTTP is used */}
      {!isHttps && (
        <div className="absolute top-[88px] left-4 right-4 z-20 bg-rose-500/15 border border-rose-500/30 rounded-2xl p-4 flex flex-col gap-1 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span>🔒 Yêu cầu bảo mật HTTPS</span>
          </div>
          <p className="text-[11px] text-rose-200/85 leading-relaxed">
            Trình duyệt Safari yêu cầu kết nối bảo mật (HTTPS) để mở Camera AR. Vui lòng quét lại mã QR (hệ thống đã tự động ép sang HTTPS cho bạn).
          </p>
        </div>
      )}
      {isFallback && isHttps && (
        <div className="absolute top-[88px] left-4 right-4 z-20 bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-1 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>⚠️ Định dạng không tương thích AR</span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            Mô hình này ở định dạng gốc ({resolvedFileName.split(".").pop() || "OBJ/ZIP"}). WebXR chỉ hỗ trợ GLB/GLTF.
            Đang hiển thị <span className="text-white font-semibold">TV Hologram làm mẫu</span> để bạn test camera.
          </p>
        </div>
      )}

      {/* Premium 3D Render Canvas (FullScreen Background) */}
      <div className="absolute inset-0 z-0">
        {isTvModel ? (
          <TVModelViewer className="w-full h-full" bloomStrength={0.25} />
        ) : isCompatibleFormat ? (
          <ModelViewer
            ref={modelViewerRef}
            src={displayModelUrl}
            ios-src={usdzUrl ?? undefined}
            alt={label}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale={arScale}
            environment-image={environmentImage}
            shadow-intensity={shadowIntensity}
            shadow-softness={shadowSoftness}
            exposure={exposure}
            camera-controls
            auto-rotate
            style={{ width: "100%", height: "100%", background: "transparent" }}
          >
            <button slot="ar-button" style={{ display: "none" }} />
          </ModelViewer>
        ) : loadingModelData ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
            <span className="text-xs uppercase tracking-widest opacity-60">Đang giải nén mô hình...</span>
          </div>
        ) : fetchError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center gap-2">
            <span className="text-2xl">❌</span>
            <span className="text-xs text-red-400">{fetchError}</span>
          </div>
        ) : objBase64 ? (
          <OBJModelViewer objData={objBase64} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
            Đang chuẩn bị Canvas...
          </div>
        )}
      </div>

      {/*
        Virtually Invisible model-viewer instance (rendered when format is incompatible or
        when displaying the TV hologram, so that the WebXR engine is loaded).
      */}
      {(isTvModel || !isCompatibleFormat) && (
        <div style={{ opacity: 0, width: "1px", height: "1px", pointerEvents: "none", position: "absolute", zIndex: -50 }}>
          <ModelViewer
            ref={modelViewerRef}
            src={displayModelUrl}
            ios-src={usdzUrl ?? undefined}
            alt={label}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale={arScale}
            environment-image={environmentImage}
            shadow-intensity={shadowIntensity}
            shadow-softness={shadowSoftness}
            exposure={exposure}
            camera-controls
            style={{ width: "100%", height: "100%" }}
          >
            <button slot="ar-button" style={{ display: "none" }} />
          </ModelViewer>
        </div>
      )}

      {/* Floating Glassmorphic Footer Controls */}
      <div
        className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-2xl border border-white/[0.08] bg-slate-950/60 backdrop-blur-md shadow-2xl"
        style={{
          marginBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
          {/* Custom Trigger Button */}
          <button
            onClick={handleLaunchAR}
            disabled={!isTvModel && !isCompatibleFormat && !objBase64}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(124,58,237,0.3)]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Smartphone className="w-4 h-4" />
            Xem trong không gian thực (AR)
          </button>

          {/* User interaction cues */}
          <div className="flex items-center justify-center gap-3 w-full text-[9px] text-slate-400 uppercase tracking-widest font-mono">
            <span>Kéo xoay</span>
            <span>•</span>
            <span>Zoom</span>
            <span>•</span>
            <span>Double tap reset</span>
          </div>
        </div>
      </div>
    </div>
  );
}
