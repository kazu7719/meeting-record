import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is disabled to support dynamic routes like /protected/minutes/[id]
  cacheComponents: false,
  // Server Actions body size limit for audio file uploads
  // 150MB to support long meetings (up to 2 hours at ~1MB/min)
  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
  },
};

export default nextConfig;
