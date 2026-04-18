// @ts-check
/**
 * SMOrchestra web — Playwright smoke test config.
 *
 * Runs against the live production site by default (smorchestra.ai).
 * Override with BASE_URL env var for local testing:
 *     BASE_URL=http://localhost:8080 npx playwright test
 *
 * CI runs this against https://smorchestra.ai after every deploy so we
 * catch Netlify-specific behavior (redirects, function invocation, caching).
 */
const { defineConfig, devices } = require("@playwright/test");

const BASE_URL = process.env.BASE_URL || "https://smorchestra.ai";

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: false,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["iPhone 13"] },
    },
  ],
});
