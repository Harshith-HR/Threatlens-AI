import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 90000,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    channel: "msedge",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/fixtures/server.mjs",
      url: "http://127.0.0.1:45123",
      reuseExistingServer: false,
      timeout: 15000,
    },
    {
      command: "npm run start -- --port 3100",
      url: "http://127.0.0.1:3100/api/session",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        SCAN_ALLOW_PRIVATE: "true",
        SCAN_ALLOWED_HOSTS: "127.0.0.1",
        THREATLENS_DATA_DIR: "test-results/workspace",
        MONGODB_DB: `threatlens_test_${Date.now()}`,
        OPENROUTER_API_KEY: "",
        APP_ACCESS_TOKEN: "test-workspace-token",
      },
    },
  ],
});
