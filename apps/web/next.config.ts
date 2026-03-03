import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@socialbud/shared"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  devIndicators: false,
};

export default nextConfig;
