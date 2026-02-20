import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": [
      "./1769869304553-player-script.js",
      "./1769869304564-player-script.js",
      "./test_bestaudio.m4a",
      "./test_default.m4a",
      "./logs/**/*",
      "./workers/**/*",
      "./scripts/**/*",
      "./docs/**/*",
    ],
  },
};

export default nextConfig;
