import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",      // <- must be public
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // optional
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
