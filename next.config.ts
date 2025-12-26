import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is disabled to support dynamic routes like /protected/minutes/[id]
  cacheComponents: false,
  // Server Actions body size limit for audio file uploads (20MB + FormData overhead)
  serverActions: {
    bodySizeLimit: '21mb',
  },
};

export default nextConfig;
