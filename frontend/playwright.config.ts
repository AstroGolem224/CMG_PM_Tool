import { defineConfig } from '@playwright/test';

const e2eServerCommand =
  process.platform === 'win32'
    ? 'powershell -ExecutionPolicy Bypass -File ..\\scripts\\start-e2e.ps1'
    : 'bash ../scripts/start-e2e.sh';

export default defineConfig({
  testDir: './src/test/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: e2eServerCommand,
    cwd: '.',
    port: 4173,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
