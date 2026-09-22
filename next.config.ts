import type { NextConfig } from "next";
import { getPracticeLanOrigin } from "./lib/practice-network.mjs";

const lanOrigin = getPracticeLanOrigin(process.env);

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigin ? [lanOrigin.hostname] : [],
  turbopack: {
    root: process.cwd(),
  },
  // Versi praktikum: permintaan internal optimizer tidak membawa Host,
  // sehingga ditolak proxy lokal. Sajikan gambar asli tanpa optimizer.
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
