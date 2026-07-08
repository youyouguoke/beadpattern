import type { NextConfig } from "next";

const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8787";

const nextConfig: NextConfig = {
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
