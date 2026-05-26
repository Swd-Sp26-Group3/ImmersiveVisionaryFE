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

    const processedObj = useMemo(() => {
        if (!obj) return null;

        // Clone to avoid mutating cached suspense object
        const clone = obj.clone(true);

        // Process geometry to prevent WebGL crashes (e.g. X4122 precision warning)
        clone.traverse((child: any) => {
            if (child.isMesh) {
                if (child.geometry) {
                    // Compute normals to prevent shader NaN crashes with lighting
                    child.geometry.computeVertexNormals();
                    // Recompute bounds to ensure Stage and raycasters don't fail
                    child.geometry.computeBoundingSphere();
                    child.geometry.computeBoundingBox();
                }

                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((mat: any) => {
                        // Make double sided so models without thickness render correctly
                        mat.side = THREE.DoubleSide;
                        // Prevent precision crashes by forcing medium precision on the material
                        mat.precision = 'mediump';
                        mat.needsUpdate = true;
                    });
                }
            }
        });

        return clone;
    }, [obj]);

    if (!processedObj) return null;

    return (
        <Center>
            <primitive object={processedObj} />
        </Center>
    );
}

// Custom robust Base64 to Uint8Array decoder.
// Bypasses browser atob() entirely to prevent any possible InvalidCharacterError.
// It ignores invalid characters, handles URL-safe base64, and handles padding automatically.
const base64ToBytes = (str: string): Uint8Array => {
    let cleanStr = str;
    const commaIdx = cleanStr.indexOf(",");
    if (commaIdx !== -1) {
        cleanStr = cleanStr.slice(commaIdx + 1);
    }

    // Decode URL-encoded base64 characters directly
    cleanStr = cleanStr.replace(/%2B/gi, "+").replace(/%2F/gi, "/").replace(/%3D/gi, "=");

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    // Support URL-safe base64 characters by mapping them
    const normalized: string[] = [];
    for (let i = 0; i < cleanStr.length; i++) {
        const char = cleanStr[i];
        if (char === "-") normalized.push("+");
        else if (char === "_") normalized.push("/");
        else if (alphabet.indexOf(char) !== -1) {
            normalized.push(char);
        }
    }
    const clean = normalized.join("");
    
    // Build lookup table
    const lookup = new Uint8Array(256);
    for (let i = 0; i < alphabet.length; i++) {
        lookup[alphabet.charCodeAt(i)] = i;
    }
    
    const len = clean.length;
    const numBytes = Math.floor((len * 3) / 4);
    const bytes = new Uint8Array(numBytes);
    
    let p = 0;
    for (let i = 0; i < len; i += 4) {
        const c1 = lookup[clean.charCodeAt(i)] || 0;
        const c2 = lookup[clean.charCodeAt(i + 1)] || 0;
        const c3 = lookup[clean.charCodeAt(i + 2)] || 0;
        const c4 = lookup[clean.charCodeAt(i + 3)] || 0;
        
        if (p < numBytes) bytes[p++] = (c1 << 2) | (c2 >> 4);
        if (p < numBytes) bytes[p++] = ((c2 & 15) << 4) | (c3 >> 2);
        if (p < numBytes) bytes[p++] = ((c3 & 3) << 6) | c4;
    }
    
    return bytes;
};

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
                // Case 1: already a real URL or blob URL — use directly
                if (objData.startsWith("http") || objData.startsWith("blob:")) {
                    setBlobUrl(objData);
                    return;
                }

                // Case 2: data: URL — decode base64 payload safely
                if (objData.startsWith("data:")) {
                    const bytes = base64ToBytes(objData);
                    const blob = new Blob([bytes as any], { type: "text/plain" });
                    currentUrl = URL.createObjectURL(blob);
                    setBlobUrl(currentUrl);
                    return;
                }

                // Case 3: raw string — bare base64 or plain .obj text
                const isBase64 = objData.length > 500 && !objData.includes(" ") && !objData.includes("\n");
                if (isBase64) {
                    const bytes = base64ToBytes(objData);
                    const blob = new Blob([bytes as any], { type: "text/plain" });
                    currentUrl = URL.createObjectURL(blob);
                } else {
                    // Plain .obj text content
                    const blob = new Blob([objData], { type: "text/plain" });
                    currentUrl = URL.createObjectURL(blob);
                }
                setBlobUrl(currentUrl);
            } catch (e) {
                console.error("3D Viewer Critical Error: Failed to process model data:", e);
            }
        };

        processModel();

        // Cleanup: revoke blob URL when modal closes or objData changes
        return () => {
            if (currentUrl) {
                // Small delay to let any in-progress render finish before revoking
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
