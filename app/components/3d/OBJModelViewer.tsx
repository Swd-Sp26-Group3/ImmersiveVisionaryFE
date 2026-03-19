"use client";
import React, { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, Center, Environment } from "@react-three/drei";
import { OBJLoader } from "three/addons/loaders/OBJLoader";
import * as THREE from "three";

interface OBJModelViewerProps {
    /** Base64 string or URL of the .obj file */
    objData: string;
}

function Model({ objData }: { objData: string }) {
    const obj = useMemo(() => {
        const loader = new OBJLoader();
        try {
            let objText = "";
            if (objData.startsWith("data:")) {
                // Handle data URL (data:application/octet-stream;base64,...)
                const base64 = objData.split(",")[1];
                objText = atob(base64);
            } else if (objData.length > 500 && !objData.includes("/")) {
                // Likely raw base64
                objText = atob(objData);
            } else {
                // Assume it's already a text string or a URL
                objText = objData;
            }

            // If it looks like a URL, we'd need useLoader(OBJLoader, url)
            // but the prompt implies Base64 from OrderAttachment table.
            if (objText.startsWith("http")) return null;

            return loader.parse(objText);
        } catch (e) {
            console.error("Failed to parse OBJ data:", e);
            return null;
        }
    }, [objData]);

    if (!obj) return null;

    return (
        <Center>
            <primitive object={obj} />
        </Center>
    );
}

export default function OBJModelViewer({ objData }: OBJModelViewerProps) {
    return (
        <div className="w-full h-[400px] bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden relative">
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    Loading 3D Model...
                </div>
            }>
                <Canvas shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 0, 5], fov: 45 }}>
                    <Stage intensity={0.5} environment="city" adjustCamera={1.2}>
                        <Model objData={objData} />
                    </Stage>
                    <OrbitControls makeDefault autoRotate />
                    <Environment preset="city" />
                </Canvas>
            </Suspense>

            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-slate-400 uppercase tracking-widest">
                    3D Interactive Preview
                </div>
            </div>
        </div>
    );
}
