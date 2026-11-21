import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    headless: true,
    trace: "off",
  },
  projects: [
    {
      name: "Mobile-320",
      use: { viewport: { width: 320, height: 568 } },
    },
    {
      name: "Mobile-360",
      use: { viewport: { width: 360, height: 800 } },
    },
    {
      name: "Mobile-375",
      use: { viewport: { width: 375, height: 667 } },
    },
    {
      name: "Mobile-390",
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: "Mobile-414",
      use: { viewport: { width: 414, height: 896 } },
    },
    {
      name: "Mobile-430",
      use: { viewport: { width: 430, height: 932 } },
    },
    {
      name: "Mobile-480",
      use: { viewport: { width: 480, height: 854 } },
    },
    {
      name: "Tablet-768",
      use: { viewport: { width: 768, height: 1024 } },
    },
  ],
});
