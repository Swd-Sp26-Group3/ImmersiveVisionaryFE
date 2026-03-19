"use client";
import React, { Suspense, useMemo, useEffect, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Center, Environment } from "@react-three/drei";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import * as THREE from "three";
const { Timer } = THREE;

// Suppress THREE.Clock deprecation warnings from internal libraries (e.g. Fiber)
if (typeof window !== "undefined") {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
        if (args[0] && typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
            return;
        }
        originalWarn(...args);
    };
}

interface OBJModelViewerProps {
    /** Base64 string or URL of the .obj file */
    objData: string;
}

function Model({ blobUrl }: { blobUrl: string }) {
    // useLoader handles caching and Suspense automatically
    const obj = useLoader(OBJLoader as any, blobUrl);

    if (!obj) return null;

    return (
        <Center>
            <primitive object={obj} />
        </Center>
    );
}

export default function OBJModelViewer({ objData }: OBJModelViewerProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    // Create a Blob URL from the Base64 data with proper lifecycle management
    useEffect(() => {
        if (!objData) {
            setBlobUrl(null);
            return;
        }

        let currentUrl: string | null = null;
        const processModel = async () => {
            try {
                if (objData.startsWith("http") || objData.startsWith("blob:")) {
                    setBlobUrl(objData);
                    return;
                }

                let dataUrl = objData;
                if (!objData.startsWith("data:")) {
                    // Extract base64 if it's a long raw string, otherwise treat as plain text
                    const isBase64 = objData.length > 500 && !objData.includes(" ");
                    if (isBase64) {
                        dataUrl = `data:application/octet-stream;base64,${objData}`;
                    } else {
                        const blob = new Blob([objData], { type: "text/plain" });
                        currentUrl = URL.createObjectURL(blob);
                        setBlobUrl(currentUrl);
                        return;
                    }
                }

                // Use fetch(dataUrl) for asynchronous decoding
                const response = await fetch(dataUrl);
                const blob = await response.blob();
                currentUrl = URL.createObjectURL(blob);
                setBlobUrl(currentUrl);
            } catch (e) {
                console.error("3D Viewer Critical Error: Failed to process model data:", e);
            }
        };

        processModel();

        // Cleanup: only revoke when effect re-runs or unmounts
        return () => {
            if (currentUrl) {
                // Small delay to ensure any pending fetch operations can complete
                // This prevents the "Failed to fetch" error during rapid re-renders
                setTimeout(() => URL.revokeObjectURL(currentUrl!), 1000);
            }
        };
    }, [objData]);

    // Create a stable Timer instance to avoid THREE.Clock deprecation warning
    const timer = useMemo(() => new Timer(), []);

    if (!blobUrl) {
        return (
            <div className="w-full h-[400px] bg-slate-900/50 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest opacity-60">Initializing...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[400px] bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden relative shadow-inner">
            <Suspense fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest opacity-60">Preparing Viewer...</span>
                </div>
            }>
                <Canvas
                    key={blobUrl}
                    shadows={{ type: THREE.PCFShadowMap }}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{
                        powerPreference: "high-performance",
                        antialias: false, // Slightly better performance
                        alpha: true,
                        stencil: false,
                        depth: true,
                    }}
                    dpr={[1, 2]} // Limit pixel ratio for performance
                    // Use custom timer to suppress Clock deprecation warning
                    {...{ clock: timer } as any}
                >
                    <Stage intensity={0.5} environment="city" adjustCamera={1.2}>
                        <Model blobUrl={blobUrl} />
                    </Stage>
                    <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} />
                    <Environment preset="city" />
                </Canvas>
            </Suspense>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                    3D Interactive Preview
                </div>
                <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded text-[9px] text-slate-500">
                    Scroll to Zoom • Drag to Rotate
                </div>
            </div>
        </div>
    );
}
