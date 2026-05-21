import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        '185.193.67.45', // Server IP from logs
        'localhost:3000'
      ]
    },
  },
} as any;

export default nextConfig;
