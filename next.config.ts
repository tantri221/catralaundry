import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";

// Hanya gunakan subpath /catralaundry jika di-build oleh GitHub Actions untuk GitHub Pages
// Di Vercel dan Localhost, basePath otomatis kosong (root domain) sehingga tidak error 404
const basePath = isGithubActions
  ? "/catralaundry"
  : (process.env.NEXT_PUBLIC_BASE_PATH || "");

const nextConfig: NextConfig = {
  ...(isGithubActions ? { output: "export", trailingSlash: true } : {}),
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
