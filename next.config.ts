import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow next-auth v5 beta
  experimental: {
    serverComponentsExternalPackages: [],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: *.amazonaws.com",
              "connect-src 'self' https://api.stripe.com " + (process.env.NEXT_PUBLIC_API_URL ?? ''),
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "font-src 'self'",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },

  // Image domains for S3 and Stripe
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 's3.amazonaws.com' },
      { protocol: 'https', hostname: 'files.stripe.com' },
    ],
  },

  // Redirect www to non-www in prod
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.bidchip.com' }],
        destination: 'https://bidchip.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
