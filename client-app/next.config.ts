import withPWA from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  scope: "/",
  sw: "service-worker.js",
});

const nextConfig: NextConfig = {
  // experimental: {
  //   ppr: true,
  // },
};

export default pwaConfig(nextConfig);
