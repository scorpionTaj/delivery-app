import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Barrel packages not optimized by default: only bundle the icons/components actually imported.
    optimizePackageImports: ["@gravity-ui/icons", "@heroui/react"],
  },
};

export default nextConfig;
