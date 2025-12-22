import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is disabled to support dynamic routes like /protected/minutes/[id]
  cacheComponents: false,
};

export default nextConfig;
