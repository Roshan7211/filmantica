import type { NextConfig } from "next";

/** The site is served from filmantica.com (Hostinger). The Vercel deployment is a
 *  complete second copy whose canonical tags point at itself, so search engines
 *  see two competing versions of every page. Send it to the real domain, but
 *  leave /api/version answering so a Vercel deploy can still be verified. */
const VERCEL_HOST = "filmantica\\.vercel\\.app";
const CANONICAL_ORIGIN = "https://filmantica.com";

const nextConfig: NextConfig = {
  /** The catalogue is read at request time with path.join(process.cwd(), "data", …).
   *  Next's tracer cannot follow a dynamically built path, so on a serverless host
   *  those JSON files are left out of the bundle and every dynamic route — search,
   *  genre pages, and the /api/stream video proxy — throws ENOENT in production
   *  while working perfectly in local dev. Include them explicitly. */
  outputFileTracingIncludes: {
    "/**": ["./data/*.json"],
  },

  async redirects() {
    return [
      {
        source: "/:path((?!api/version$).*)",
        has: [{ type: "host", value: VERCEL_HOST }],
        destination: `${CANONICAL_ORIGIN}/:path`,
        permanent: true,
      },
    ];
  },

  /** Hostinger adds none of these. HSTS deliberately omits includeSubDomains:
   *  www has no valid certificate yet, and HSTS would turn its warning into a
   *  hard failure with no way through. */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
