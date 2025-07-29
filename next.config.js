/** @type {import('next').NextConfig} */
const nextConfig = {
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
