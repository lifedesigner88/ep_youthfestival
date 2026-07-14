import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173/ep_youthfestival/',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'small-mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 568 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'mobile-landscape',
      use: {
        browserName: 'chromium',
        viewport: { width: 667, height: 375 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'desktop-chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/ep_youthfestival/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
