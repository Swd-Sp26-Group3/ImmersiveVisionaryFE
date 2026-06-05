"use client";
import { useState, useCallback } from "react";
import QRCode from "qrcode";
import { QrCode, X, Smartphone } from "lucide-react";

interface ARQRButtonProps {
  /** Absolute public URL of the GLB/GLTF file */
  modelUrl: string;
  /** Display name shown on the AR view page */
  label?: string;
  /** Optional USDZ URL for iOS AR QuickLook */
  usdzUrl?: string;
  /** Extra className for the trigger button */
  className?: string;
}

export function ARQRButton({ modelUrl, label = "3D Model", usdzUrl, className }: ARQRButtonProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleOpen = useCallback(async () => {
    setGenerating(true);
    try {
      let origin = window.location.origin;
      let updatedModelUrl = modelUrl;

      // If running on localhost/127.0.0.1, resolve the LAN IP so mobile devices can connect
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        try {
          const res = await fetch("/api/local-ip");
          const data = await res.json();
          if (data.localIp) {
            origin = origin.replace("localhost", data.localIp).replace("127.0.0.1", data.localIp);
            updatedModelUrl = updatedModelUrl.replace("localhost", data.localIp).replace("127.0.0.1", data.localIp);
          }
        } catch (e) {
          console.warn("Failed to fetch local network IP, using default origin:", e);
        }
      }

      // Force HTTPS protocol for local IP to enable Camera API access on mobile devices
      if (origin.startsWith("http://")) {
        origin = origin.replace("http://", "https://");
      }
      if (updatedModelUrl.startsWith("http://")) {
        updatedModelUrl = updatedModelUrl.replace("http://", "https://");
      }

      // Extract clean filename with extension for the ar-view page
      let extractedFileName = "model.glb";
      if (label && label.includes(".")) {
        extractedFileName = label;
      } else {
        const queryMatch = updatedModelUrl.match(/[?&]fileName=([^&]+)/i);
        if (queryMatch) {
          extractedFileName = decodeURIComponent(queryMatch[1]);
        } else {
          extractedFileName = updatedModelUrl.split("/").pop() || "model.glb";
        }
      }

      const params = new URLSearchParams({
        model: updatedModelUrl,
        label,
        fileName: extractedFileName,
        ...(usdzUrl ? { usdz: usdzUrl } : {}),
      });
      const arUrl = `${origin}/ar-view?${params.toString()}`;

      const dataUrl = await QRCode.toDataURL(arUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#ffffff", light: "#0f0c29" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
      setOpen(true);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    } finally {
      setGenerating(false);
    }
  }, [modelUrl, label, usdzUrl]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        disabled={generating}
        title="Xem mô hình 3D trong không gian thực qua điện thoại"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ""}`}
        style={{
          background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
          boxShadow: "0 2px 12px rgba(109,40,217,0.45)",
        }}
      >
        {generating ? (
          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <QrCode className="w-3.5 h-3.5" />
        )}
        Xem AR
      </button>

      {/* QR Code Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative rounded-2xl p-7 max-w-xs w-full flex flex-col items-center gap-5"
            style={{
              background: "rgba(13,10,35,0.97)",
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(109,40,217,0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
              >
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-bold text-base mb-1">Xem AR trên điện thoại</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Mở camera điện thoại và quét QR code để xem mô hình trong không gian thực
              </p>
            </div>

            {/* QR Code */}
            {qrDataUrl && (
              <div className="p-2 rounded-xl" style={{ background: "#0f0c29", border: "1px solid rgba(139,92,246,0.2)" }}>
                <img
                  src={qrDataUrl}
                  alt="AR QR Code"
                  width={220}
                  height={220}
                  className="rounded-lg block"
                />
              </div>
            )}

            {/* Platform notes */}
            <div className="w-full rounded-xl px-4 py-3 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>📱</span>
                <span><span className="text-white font-medium">Android</span> — Chrome → WebXR AR (đặt lên mặt sàn)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>🍎</span>
                <span><span className="text-white font-medium">iOS</span> — Safari → AR QuickLook (built-in)</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-600 text-center">
              Cần điện thoại kết nối cùng mạng WiFi hoặc internet
            </p>
          </div>
        </div>
      )}
    </>
  );
}
