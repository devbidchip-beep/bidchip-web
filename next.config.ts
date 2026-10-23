import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  // Allow next-auth v5 beta
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
