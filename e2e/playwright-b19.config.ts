import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e', timeout: 30_000, expect: { timeout: 10_000 }, fullyParallel: false, workers: 1,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
