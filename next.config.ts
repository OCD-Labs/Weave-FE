import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },

  // Optional backend proxy for Railway private networking.
  //
  // When BACKEND_INTERNAL_URL is set (a server-only var, like
  // http://weave.railway.internal:8080), browser calls to /be/* are proxied by
  // THIS Next.js server to the backend over Railway's private network. The
  // browser only ever talks to its own origin, so there is no CORS and the
  // .railway.internal host is resolved server-side (where it actually works).
  // Enable it by also setting NEXT_PUBLIC_BACKEND_URL=/be. Unset = no proxy
  // (the app calls the public backend URL directly, unchanged).
  async rewrites() {
    const internal = process.env.BACKEND_INTERNAL_URL;
    if (!internal) return [];
    return [{ source: "/be/:path*", destination: `${internal}/:path*` }];
  },
};

export default nextConfig;
