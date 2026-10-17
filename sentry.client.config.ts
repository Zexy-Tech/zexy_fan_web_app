// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === 'production';

Sentry.init({
  dsn: isProduction ? "https://b7a3527ba6702f1bdd1dac8ad01a096a@o4511432134557696.ingest.us.sentry.io/4511432642658304" : undefined,
  enabled: isProduction,
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: isProduction
    ? [
        Sentry.replayIntegration({
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
        }),
      ]
    : [],
});
