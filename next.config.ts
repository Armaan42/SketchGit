import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  // tldraw uses some Node.js modules that shouldn't be bundled for the server
  serverExternalPackages: [],
};

export default nextConfig;
