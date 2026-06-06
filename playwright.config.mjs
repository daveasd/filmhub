import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'https://dawit-filmhub.vercel.app',
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  reporter: [['list'], ['json', { outputFile: 'tests/qa-playwright-report.json' }]],
});
