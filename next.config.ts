import type { NextConfig } from "next";

// Backend base URL: use env var on Vercel, fall back to localhost for local dev
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return {
      // beforeFiles: checked before Next.js page/API routes — leave empty
      beforeFiles: [],
      // afterFiles: only matched if no native Next.js route handles the request.
      // This means /api/chat (a real Route Handler) is served by Next.js directly,
      // while /api/anything-else is proxied to the backend.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
      // fallback: checked after the filesystem
      fallback: [],
    };
  },
};

export default nextConfig;

