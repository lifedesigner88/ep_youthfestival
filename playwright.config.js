import { defineConfig, devices } from '@playwright/test'

const localBaseURL = 'http://127.0.0.1:4173/ep_youthfestival/'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localBaseURL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL,
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
        userAgent: devices['Pixel 7'].userAgent,
      },
    },
    {
      name: 'mobile-landscape',
      use: {
        browserName: 'chromium',
        viewport: { width: 667, height: 375 },
        isMobile: true,
        hasTouch: true,
        userAgent: devices['Pixel 7'].userAgent,
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
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 4173',
        url: localBaseURL,
        reuseExistingServer: true,
        timeout: 30_000,
      },
})
