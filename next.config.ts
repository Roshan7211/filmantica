import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** The catalogue is read at request time with path.join(process.cwd(), "data", …).
   *  Next's tracer cannot follow a dynamically built path, so on a serverless host
   *  those JSON files are left out of the bundle and every dynamic route — search,
   *  genre pages, and the /api/stream video proxy — throws ENOENT in production
   *  while working perfectly in local dev. Include them explicitly. */
  outputFileTracingIncludes: {
    "/**": ["./data/*.json"],
  },
};

export default nextConfig;
