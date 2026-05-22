import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "adysun-ventures-pvt-ltd",
    project: "react-native",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with `appDir`, see
    // https://github.com/getsentry/sentry-javascript/issues/9049)
    automaticVercelMonitors: true,
  }
);
