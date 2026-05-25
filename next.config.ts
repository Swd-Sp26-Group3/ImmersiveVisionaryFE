import type { NextConfig } from "next";

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "").trim();
const BACKEND_URL = rawApiUrl.length > 0 ? rawApiUrl : "https://api.immersivevisionary.name.vn";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    // afterFiles: only matched if no native Next.js route handles the request.
    // → /api/chat (Next.js Route Handler) is served directly by Next.js.
    // → All other /api/* paths are proxied to the backend — avoids CORS in browser.
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${BACKEND_URL}/api/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;

