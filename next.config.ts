import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Cloudflare Pages static export cannot run the default Next.js
  // image optimizer at request time. `unoptimized: true` pre-empts the
  // build error any future `<Image />` import would otherwise throw.
  // (Per node_modules/next/dist/docs/01-app/02-guides/static-exports.md.)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
