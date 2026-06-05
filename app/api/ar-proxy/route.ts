import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/apiBase";
import fs from "fs";
import path from "path";

// Disable SSL verification in development to allow fetching from local HTTPS servers with self-signed certs
if (process.env.NODE_ENV === "development") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/**
 * /api/ar-proxy?attachmentId=<id>
 *
 * Server-side proxy that fetches a 3D model attachment from the backend API
 * and streams it as a proper binary response with CORS headers.
 *
 * Supports localhost testing: falls back to streaming a demo GLB model if the local backend is down.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const attachmentId = searchParams.get("attachmentId");
  const token = searchParams.get("token");

  // Determine if it is development mode (safe from host-header spoofing in production)
  const isDevMode = process.env.NODE_ENV === "development";

  if (!attachmentId) {
    return NextResponse.json({ error: "Missing attachmentId" }, { status: 400 });
  }

  // Token is required in production, but optional in local testing (development mode)
  if (!token && !isDevMode && attachmentId !== "test") {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }

  // Helper to serve the mock/test model (Astronaut.glb) locally from public folder
  const serveTestModel = async () => {
    // Block serving local files in production unless explicitly using public test ids
    if (!isDevMode && attachmentId !== "test" && attachmentId !== "demo") {
      return NextResponse.json({ error: "Method not allowed in production" }, { status: 403 });
    }
    try {
      console.log("[ar-proxy] Localhost testing mode: returning local public/Astronaut.glb model.");
      const filePath = path.join(process.cwd(), "public", "Astronaut.glb");
      if (fs.existsSync(filePath)) {
        const binaryStr = fs.readFileSync(filePath);
        return new NextResponse(binaryStr, {
          status: 200,
          headers: {
            "Content-Type": "model/gltf-binary",
            "Content-Disposition": `inline; filename="Astronaut.glb"`,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=300",
          },
        });
      } else {
        console.warn("[ar-proxy] Local Astronaut.glb not found at:", filePath);
      }
    } catch (e) {
      console.error("[ar-proxy] Failed to read local Astronaut.glb model:", e);
    }
    return NextResponse.json({ error: "Failed to load test model" }, { status: 500 });
  };

  if (attachmentId === "test" || attachmentId === "demo") {
    return serveTestModel();
  }

  try {
    const backendUrl = buildApiUrl(`/attachments/${attachmentId}`);
    let res;
    try {
      res = await fetch(backendUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
    } catch (fetchErr) {
      console.warn("[ar-proxy] Backend connection failed:", fetchErr);
      if (isDevMode) {
        return serveTestModel();
      }
      throw fetchErr;
    }

    if (!res.ok) {
      console.warn(`[ar-proxy] Backend returned status ${res.status}`);
      if (isDevMode) {
        return serveTestModel();
      }
      return NextResponse.json(
        { error: `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    try {
      const data = await res.json();
      const attachment = data.data ?? data;
      const base64Data: string | undefined = attachment.Base64Data;
      const fileName: string = attachment.FileName ?? "model.glb";

      if (!base64Data) {
        if (isDevMode) {
          return serveTestModel();
        }
        return NextResponse.json({ error: "No Base64Data in attachment" }, { status: 404 });
      }

      // Strip data URL prefix if present (e.g. "data:model/gltf-binary;base64,")
      const raw = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;

      // Decode Base64 → binary
      const binaryStr = Buffer.from(raw, "base64");

      // Detect MIME type from file extension
      const ext = fileName.toLowerCase().split(".").pop() ?? "glb";
      const mimeTypes: Record<string, string> = {
        glb: "model/gltf-binary",
        gltf: "model/gltf+json",
        obj: "text/plain",
        usdz: "model/vnd.usdz+zip",
      };
      const mimeType = mimeTypes[ext] ?? "application/octet-stream";

      return new NextResponse(binaryStr, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${fileName}"`,
          // Allow model-viewer running on mobile to fetch the model
          "Access-Control-Allow-Origin": "*",
          // Cache for 5 minutes — model won't change within a review session
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch (parseOrDecodeErr) {
      console.error("[ar-proxy] Failed to parse or decode attachment data:", parseOrDecodeErr);
      if (isDevMode) {
        return serveTestModel();
      }
      throw parseOrDecodeErr;
    }
  } catch (err) {
    console.error("[ar-proxy] Error:", err);
    return NextResponse.json({ error: "Internal proxy error" }, { status: 500 });
  }
}
