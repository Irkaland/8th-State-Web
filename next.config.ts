import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Local demo imagery only - no remote patterns needed.
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 82, 90],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [390, 640, 768, 1024, 1280, 1440, 1920, 2400],
  },
  // Preview builds can be marked noindex via NEXT_PUBLIC_SITE_NOINDEX (see robots.ts).
  async headers() {
    if (process.env.NEXT_PUBLIC_SITE_NOINDEX === "true") {
      return [
        {
          source: "/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
