import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Product photos are served from the public R2 bucket (r2.dev or a custom domain).
const r2Public = process.env.R2_PUBLIC_BASE_URL ? new URL(process.env.R2_PUBLIC_BASE_URL) : null;
// Browsers upload to, and admins view private images from, the R2 S3 endpoint via presigned URLs.
const r2Api = process.env.R2_ENDPOINT
  ? new URL(process.env.R2_ENDPOINT).origin
  : process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : null;

/**
 * Content Security Policy without nonces. Nonces would force every page to render
 * dynamically and can't be used with Partial Prerendering, so inline scripts are
 * allowed and the policy instead locks down where code, images and connections can
 * come from. See node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  ["img-src 'self' data: blob:", r2Public?.origin, r2Api].filter(Boolean).join(" "),
  "font-src 'self'",
  ["connect-src 'self'", r2Api].filter(Boolean).join(" "),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // HSTS only in production; Vercel serves everything over HTTPS.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    remotePatterns: r2Public ? [{ protocol: r2Public.protocol.replace(":", "") as "https" | "http", hostname: r2Public.hostname, pathname: "/**" }] : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
