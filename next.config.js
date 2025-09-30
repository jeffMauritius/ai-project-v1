const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    domains: ["images.unsplash.com", "blob.vercel-storage.com", "pub-*.s3.amazonaws.com"]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false
  },
  typescript: {
    ignoreBuildErrors: true
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false }
    return config
  }
};

module.exports = nextConfig;
