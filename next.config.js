const withNextIntl = require('next-intl/plugin')(
  './src/i18n/config.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle PDF.js canvas module issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Ignore canvas module for client-side builds
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        canvas: 'canvas',
      });
    }
    
    return config;
  },
  
  // Environment variables
  env: {
    // Add any environment variables here
  },
  
  // Redirects
  async redirects() {
    return [
      // Add any redirects here
    ];
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

