/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com']
  },
  swcMinify: true,
  compiler: {
    // Preserve warnings in development
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false
  },
 
  webpack: (config) => {
    config.resolve.fallback = { fs: false }
    return config
  },
  output: 'export',
  trailingSlash: true,
  // Améliorer la gestion des polices
  optimizeFonts: true
};

module.exports = nextConfig;