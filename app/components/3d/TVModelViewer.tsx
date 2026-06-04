import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the TV Client component with SSR disabled to prevent server-side rendering crashes
const TVModelViewerClient = dynamic(() => import("./TVModelViewerClient"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-slate-900/50 rounded-2xl flex items-center justify-center text-slate-500 border border-white/10">
            <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest opacity-60">Initializing TV Viewer...</span>
            </div>
        </div>
    ),
});

interface TVModelViewerProps {
    className?: string;
    bloomStrength?: number;
}

export default function TVModelViewer(props: TVModelViewerProps) {
    return <TVModelViewerClient {...props} />;
}
