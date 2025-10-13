/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds in Docker
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  typescript: {
    // Disable TypeScript errors during builds in Docker
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  async rewrites() {
    return [
      {
        source: '/api/resend/:path*',
        destination: 'https://api.resend.com/:path*',
      },
    ]
  },
}

module.exports = nextConfig
