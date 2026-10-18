import "dotenv/config";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  workers: 1,
  expect: { timeout: 20000 },
  timeout: 90000,
  use: { baseURL: "http://localhost:3030", headless: true },
  webServer: {
    command: "npm run start -- -p 3030",
    url: "http://localhost:3030/login",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
