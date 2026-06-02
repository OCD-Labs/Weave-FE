import type { NextConfig } from "next";
import path from "node:path";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  // Pin the workspace/Turbopack root to THIS folder.
  //
  // A stray package-lock.json in a parent directory (e.g. ~/package-lock.json)
  // otherwise makes Next/Turbopack infer the home directory as the project
  // root, then crawl & file-watch everything under it on `next dev` — which
  // exhausts CPU/memory/file-descriptors and can hang or crash the machine.
  //
  // outputFileTracingRoot governs the build trace; turbopack.root governs the
  // dev file-watcher. Both must be pinned.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
