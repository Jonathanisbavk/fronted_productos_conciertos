import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/:path*',      destination: 'http://localhost:3000/api/:path*' },
      { source: '/uploads/:path*',  destination: 'http://localhost:3000/uploads/:path*' },
      { source: '/metadata/:path*', destination: 'http://localhost:3000/metadata/:path*' },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3000' },
    ],
  },
};

export default nextConfig;
