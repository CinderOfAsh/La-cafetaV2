import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Permitir acceso cross-origin al dev server desde cualquier origen
  // (necesario cuando se accede vía túnel Cloudflare / Tailscale).
  // Solo aplica a `next dev`; en producción se sirve vía standalone.
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.0.165", "localhost"],
};

export default nextConfig;
