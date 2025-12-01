import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "safar.mulverse.com",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Ensure webpack handles font resolution instead of Turbopack
    // This prevents the '@vercel/turbopack-next/internal/font/google/font' resolution error
    if (!isServer && config.resolve) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
      };
    }
    return config;
  },
  turbopack: {}, // Empty config to silence warning when webpack is used
};

export default nextConfig;
