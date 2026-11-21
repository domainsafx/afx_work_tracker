import { chromium } from "playwright";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });

const BASE_URL = "http://localhost:3000";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@gmail.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "";

const VIEWPORTS = [
  { name: "iPhone SE (1st gen)", width: 320, height: 568 },
  { name: "Compact Android", width: 360, height: 800 },
  { name: "iPhone SE / 8", width: 375, height: 667 },
  { name: "iPhone 12 / 13 / 14", width: 390, height: 844 },
  { name: "iPhone Plus / Max", width: 414, height: 896 },
  { name: "iPhone 14 / 15 Pro Max", width: 430, height: 932 },
  { name: "Large Mobile / Phablet", width: 480, height: 854 },
  { name: "Tablet Portrait (iPad)", width: 768, height: 1024 },
];

const PUBLIC_ROUTES = [
  { name: "Login", path: "/login" },
  { name: "Forgot Password", path: "/forgot-password" },
  { name: "Download APK", path: "/download" },
];

const PROTECTED_ROUTES = [
  { name: "Dashboard Overview", path: "/dashboard" },
  { name: "Employees Directory", path: "/dashboard/employees" },
  { name: "Tasks Management", path: "/dashboard/tasks" },
  { name: "Work Log", path: "/dashboard/work-log" },
  { name: "Leave Requests", path: "/dashboard/leave" },
  { name: "Clients Directory", path: "/dashboard/clients" },
  { name: "Shoots Logs & Calendar", path: "/dashboard/shoots" },
  { name: "Deliveries Calendar", path: "/dashboard/deliveries" },
  { name: "Messages Chat", path: "/dashboard/messages" },
  { name: "Meetings", path: "/dashboard/meetings" },
  { name: "Notifications", path: "/dashboard/notifications" },
  { name: "Profile", path: "/dashboard/profile" },
  { name: "Reports Analytics", path: "/dashboard/reports" },
  { name: "Transfers", path: "/dashboard/transfers" },
  { name: "Holidays Calendar", path: "/dashboard/holidays" },
];

interface Measurement {
  viewportName: string;
  viewportWidth: number;
  viewportHeight: number;
  routeName: string;
  routePath: string;
  scrollWidth: number;
  clientWidth: number;
  innerWidth: number;
  hasHorizontalScroll: boolean;
  offendingCount: number;
  status: "PASS" | "FAIL";
}

async function run() {
  console.log("Starting Full-Matrix Zero Horizontal Overflow Verification...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results: Measurement[] = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();

    // 1. Test Public Routes
    for (const r of PUBLIC_ROUTES) {
      await page.goto(`${BASE_URL}${r.path}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(300);

      const m = await evaluateOverflow(page, vp, r.name, r.path);
      results.push(m);
      console.log(`  [${m.status}] ${r.name}: scrollW=${m.scrollWidth}, clientW=${m.clientWidth}`);
    }

    // 2. Sign In for Protected Routes
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[id="email"]', SUPER_ADMIN_EMAIL);
    await page.fill('input[id="password"]', SUPER_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForTimeout(500);

    // 3. Test Protected Routes
    for (const r of PROTECTED_ROUTES) {
      await page.goto(`${BASE_URL}${r.path}`);
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(350);

      const m = await evaluateOverflow(page, vp, r.name, r.path);
      results.push(m);
      console.log(`  [${m.status}] ${r.name}: scrollW=${m.scrollWidth}, clientW=${m.clientWidth}`);
    }

    // 4. Test Dynamic Detail Pages
    // Employee Detail
    await page.goto(`${BASE_URL}/dashboard/employees`);
    await page.waitForLoadState("domcontentloaded");
    const empLink = await page.$('a[href^="/dashboard/employees/"]');
    if (empLink) {
      const href = await empLink.getAttribute("href");
      if (href && href !== "/dashboard/employees") {
        await page.goto(`${BASE_URL}${href}`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(350);
        const m = await evaluateOverflow(page, vp, "Employee Detail View", href);
        results.push(m);
        console.log(`  [${m.status}] Employee Detail View: scrollW=${m.scrollWidth}, clientW=${m.clientWidth}`);
      }
    }

    // Task Detail
    await page.goto(`${BASE_URL}/dashboard/tasks`);
    await page.waitForLoadState("domcontentloaded");
    const taskLink = await page.$('a[href^="/dashboard/tasks/"]');
    if (taskLink) {
      const href = await taskLink.getAttribute("href");
      if (href && href !== "/dashboard/tasks") {
        await page.goto(`${BASE_URL}${href}`);
        await page.waitForLoadState("domcontentloaded");
        await page.waitForTimeout(350);
        const m = await evaluateOverflow(page, vp, "Task Detail View", href);
        results.push(m);
        console.log(`  [${m.status}] Task Detail View: scrollW=${m.scrollWidth}, clientW=${m.clientWidth}`);
      }
    }

    await context.close();
  }

  await browser.close();

  // Save results to JSON file
  const outPath = path.join(process.cwd(), "docs", "implementation", "overflow_test_results.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`\nResults saved successfully to: ${outPath}`);

  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  console.log(`\n========================================`);
  console.log(`TOTAL MEASUREMENTS: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${Math.round((passed / results.length) * 100)}%`);
  console.log(`========================================\n`);
}

async function evaluateOverflow(
  page: any,
  vp: { name: string; width: number; height: number },
  routeName: string,
  routePath: string
): Promise<Measurement> {
  const evalData = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = doc.scrollWidth;
    const clientWidth = doc.clientWidth;
    const innerWidth = window.innerWidth;

    const all = Array.from(document.querySelectorAll("body *"));
    let offendingCount = 0;

    for (const el of all) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      if (rect.right > innerWidth + 1.0) {
        let current: HTMLElement | null = el as HTMLElement;
        let isClipped = false;
        while (current && current !== body) {
          const pStyle = window.getComputedStyle(current);
          if (
            (pStyle.overflowX === "hidden" || pStyle.overflowX === "clip" || pStyle.overflow === "hidden") &&
            current.getBoundingClientRect().right <= innerWidth + 1.0
          ) {
            isClipped = true;
            break;
          }
          current = current.parentElement;
        }
        if (!isClipped) offendingCount++;
      }
    }

    return {
      scrollWidth,
      clientWidth,
      innerWidth,
      offendingCount,
    };
  });

  const isPass = evalData.scrollWidth <= evalData.clientWidth && evalData.offendingCount === 0;

  return {
    viewportName: vp.name,
    viewportWidth: vp.width,
    viewportHeight: vp.height,
    routeName,
    routePath,
    scrollWidth: evalData.scrollWidth,
    clientWidth: evalData.clientWidth,
    innerWidth: evalData.innerWidth,
    hasHorizontalScroll: evalData.scrollWidth > evalData.clientWidth,
    offendingCount: evalData.offendingCount,
    status: isPass ? "PASS" : "FAIL",
  };
}

run().catch((err) => {
  console.error("Verification run failed:", err);
  process.exit(1);
});
