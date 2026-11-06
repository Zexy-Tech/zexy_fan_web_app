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
    // Smallest first: browsers that support AVIF get it, else WebP.
    formats: ['image/avif', 'image/webp'],
    // Optimized variants are keyed by URL; media files never change in place, so cache for a day.
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  // Production only: Turbopack (dev) rejects the `compiler` option even when it is a no-op.
  ...(process.env.NODE_ENV === 'production' && {
    compiler: { removeConsole: { exclude: ['error', 'warn'] } },
  }),
  // Each Font Awesome named import compiles to its own icon file instead of a ~1 MB pack index.
  modularizeImports: {
    '@fortawesome/free-solid-svg-icons': { transform: '@fortawesome/free-solid-svg-icons/{{member}}', skipDefaultConversion: true },
    '@fortawesome/free-regular-svg-icons': { transform: '@fortawesome/free-regular-svg-icons/{{member}}', skipDefaultConversion: true },
    '@fortawesome/free-brands-svg-icons': { transform: '@fortawesome/free-brands-svg-icons/{{member}}', skipDefaultConversion: true },
  },
  experimental: {
    // Client router cache: a visited page is reused on back/forward and re-visits instead of refetched.
    staleTimes: { dynamic: 60, static: 300 },
    optimizePackageImports: [
      'date-fns',
      '@tanstack/react-query',
      'axios',
      'sonner',
      'socket.io-client',
    ],
  },
};

export default nextConfig;
