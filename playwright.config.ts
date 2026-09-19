import { defineConfig } from '@playwright/test';

// A bundled, single-process Chromium needs one browser worker per test.
const singleProcess = process.env.CHROME_SINGLE_PROCESS === '1';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  workers: singleProcess ? 5 : 1,
  fullyParallel: singleProcess,
  use: {
    baseURL: 'http://127.0.0.1:4321',
    viewport: { width: 1440, height: 960 },
    launchOptions: {
      executablePath: process.env.CHROME_PATH || undefined,
      args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        ...(singleProcess ? ['--single-process', '--in-process-gpu', '--no-zygote'] : [])],
    },
  },
  webServer: {
    command: 'node scripts/preview-test.mjs',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
});
