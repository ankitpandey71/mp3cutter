import type { NextConfig } from "next";

/**
 * Everything runs client-side, so the app needs no third-party origins beyond
 * the ad network that gets wired up later. Headers are kept conservative and
 * permissive enough for the Web Audio / MediaRecorder APIs the tools rely on.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // microphone stays on for the voice recorder; everything else is denied
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), interest-cohort=(), microphone=(self)",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: securityHeaders }],
};

export default nextConfig;
