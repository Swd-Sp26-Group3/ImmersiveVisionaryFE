import type { NextConfig } from "next";

// Use NEXT_PUBLIC_API_URL for consistency, falling back to localhost for local dev.
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    // In production, the frontend should make absolute URL calls to the API domain.
    // The rewrite configuration is only for local development to proxy requests
    // and avoid CORS issues. We are removing it to prevent it from interfering
    // with production builds on Vercel.
    if (process.env.NODE_ENV === "production") {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

