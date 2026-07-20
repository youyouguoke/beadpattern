import type { NextConfig } from "next";

const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8787";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-98e050954fa34ccebe6d2e8911f520a3.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/admin/:path*",
        destination: `${adminApiUrl}/api/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
