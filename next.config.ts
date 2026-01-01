import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/:slug',
        destination: '/status/:slug',
        has: [
          {
            type: 'host',
            value: 'status.sleepcomet.com',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "sleepcomet",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
