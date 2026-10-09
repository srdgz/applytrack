import { defineConfig, devices } from "@playwright/test";

process.env.PLAYWRIGHT_BROWSERS_PATH ??= "0";

const PORT = 4173;

const sizes = [
  { name: "mobile-360", width: 360, height: 640, touch: true },
  { name: "tablet-768", width: 768, height: 1024, touch: false },
  { name: "desktop-1280", width: 1280, height: 800, touch: false },
  { name: "wide-1920", width: 1920, height: 1080, touch: false },
] as const;

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never", outputFolder: "playwright-report" }]]
    : [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    ...sizes.map(({ name, width, height, touch }) => ({
      name,
      testIgnore: /screenshots\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width, height },
        hasTouch: touch,
        isMobile: touch,
      },
    })),
    {
      name: "screenshots",
      testMatch: /screenshots\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm exec vite preview --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_SUPABASE_URL: "",
      VITE_SUPABASE_PUBLISHABLE_KEY: "",
    },
  },
});
