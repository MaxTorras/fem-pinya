import type { NextConfig } from "next";
import withPWA from 'next-pwa';

import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})(/** your config here */);

export default nextConfig;

