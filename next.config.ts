import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/resend/:path*',
        destination: 'https://api.resend.com/:path*',
      },
    ]
  },
};

export default nextConfig;
