import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the Heavy Three.js client component to prevent SSR crashes
// Since Three.js touches window and WebGL, rendering it on server fails
const OBJModelViewerClient = dynamic(() => import("./OBJModelViewerClient"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[400px] bg-slate-900/50 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10">
            <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest opacity-60">Initializing Viewer...</span>
            </div>
        </div>
    ),
});

interface OBJModelViewerProps {
    /** Base64 string or URL of the .obj file */
    objData: string;
}

export default function OBJModelViewer(props: OBJModelViewerProps) {
    return <OBJModelViewerClient {...props} />;
}
