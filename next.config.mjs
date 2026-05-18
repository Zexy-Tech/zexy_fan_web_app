/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: '/feed', destination: '/creators', permanent: false }];
  },
  // Strict Mode remounts <Router> in dev; Next 14 clears a module-level `initialParallelRoutes`
  // map on first mount, so the remount can crash with:
  // "Cannot read properties of null (reading 'get')" in fillLazyItemsTillLeafWithHead.
  // Re-enable after upgrading to a Next release that fixes this (see vercel/next.js #67730 / #75360).
  reactStrictMode: false,
  images: {
    domains: ['api.zexy.live', 'localhost'],
  },
};

export default nextConfig;
