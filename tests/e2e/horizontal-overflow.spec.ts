import { test, expect, type Page } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.local" });

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@gmail.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "";

// Custom overflow evaluator
async function assertZeroHorizontalOverflow(page: Page, contextName: string) {
  // Ensure the page is loaded and any animations settled
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(300);

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const clientWidth = doc.clientWidth;
    const scrollWidth = doc.scrollWidth;
    const innerWidth = window.innerWidth;
    const bodyScrollWidth = body ? body.scrollWidth : 0;

    // Check for elements that extend beyond window.innerWidth
    const all = Array.from(document.querySelectorAll("body *"));
    const offending: {
      tag: string;
      className: string;
      rectRight: number;
      innerWidth: number;
      overflowPx: number;
    }[] = [];

    for (const el of all) {
      // Ignore hidden or zero-size elements
      const style = window.getComputedStyle(el);
      if (
        style.display === "none" ||
        style.visibility === "hidden" ||
        style.opacity === "0"
      ) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      // Allow 1.0px tolerance for subpixel rounding
      if (rect.right > innerWidth + 1.0) {
        // Exclude elements that are clipped by an ancestor with overflow hidden/clip
        let current: HTMLElement | null = el as HTMLElement;
        let isClipped = false;
        while (current && current !== document.body) {
          const parentStyle = window.getComputedStyle(current);
          if (
            (parentStyle.overflowX === "hidden" ||
              parentStyle.overflowX === "clip" ||
              parentStyle.overflow === "hidden") &&
            current.getBoundingClientRect().right <= innerWidth + 1.0
          ) {
            isClipped = true;
            break;
          }
          current = current.parentElement;
        }

        if (!isClipped) {
          offending.push({
            tag: el.tagName,
            className: (el.className || "").toString().slice(0, 100),
            rectRight: Math.round(rect.right),
            innerWidth,
            overflowPx: Math.round(rect.right - innerWidth),
          });
        }
      }
    }

    return {
      scrollWidth,
      clientWidth,
      innerWidth,
      bodyScrollWidth,
      offending,
    };
  });

  expect(
    metrics.scrollWidth,
    `Horizontal scrollWidth (${metrics.scrollWidth}px) exceeds clientWidth (${metrics.clientWidth}px) on ${contextName}`
  ).toBeLessThanOrEqual(metrics.clientWidth);

  expect(
    metrics.offending,
    `Elements overflow viewport boundary on ${contextName}: ${JSON.stringify(
      metrics.offending
    )}`
  ).toEqual([]);
}

test.describe("Strict Zero Horizontal Scrolling Verification", () => {
  test.describe("Public Routes", () => {
    test("Login page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/login");
      await assertZeroHorizontalOverflow(page, "Login Page");
    });

    test("Forgot password page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/forgot-password");
      await assertZeroHorizontalOverflow(page, "Forgot Password Page");
    });

    test("Download page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/download");
      await assertZeroHorizontalOverflow(page, "Download APK Page");
    });
  });

  test.describe("Protected Dashboard Routes", () => {
    test.beforeEach(async ({ page }) => {
      // Sign in as Super Admin
      await page.goto("/login");
      await page.fill('input[id="email"]', SUPER_ADMIN_EMAIL);
      await page.fill('input[id="password"]', SUPER_ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      // Wait until redirected to dashboard
      await page.waitForURL("**/dashboard**", { timeout: 15000 });
    });

    test("Dashboard overview has zero horizontal overflow", async ({
      page,
    }) => {
      await assertZeroHorizontalOverflow(page, "Dashboard Overview");
    });

    test("Mobile navigation drawer opens and fits within viewport", async ({
      page,
    }) => {
      const isMobile = (page.viewportSize()?.width ?? 1024) < 768;
      if (isMobile) {
        // Open drawer
        const menuBtn = page.locator('button[aria-label="Open navigation menu"]');
        if (await menuBtn.isVisible()) {
          await menuBtn.click();
          await page.waitForTimeout(350); // wait for slide animation

          const drawer = page.locator('div[role="dialog"][aria-label="Navigation drawer"]');
          await expect(drawer).toBeVisible();

          const drawerMetrics = await drawer.evaluate((el) => ({
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            rectRight: el.getBoundingClientRect().right,
            innerWidth: window.innerWidth,
          }));

          expect(drawerMetrics.rectRight).toBeLessThanOrEqual(
            drawerMetrics.innerWidth + 1
          );

          // Close drawer
          const closeBtn = page.locator('button[aria-label="Close navigation menu"]');
          await closeBtn.click();
          await page.waitForTimeout(350);
        }
      }
    });

    test("Employees directory and detail page have zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/employees");
      await assertZeroHorizontalOverflow(page, "Employees Directory");

      // Check employee detail if any employee link exists
      const employeeLink = page.locator('a[href^="/dashboard/employees/"]').first();
      if (await employeeLink.isVisible()) {
        await employeeLink.click();
        await page.waitForLoadState("domcontentloaded");
        await assertZeroHorizontalOverflow(page, "Employee Detail View");
      }
    });

    test("Tasks management and detail page have zero horizontal overflow (List & Calendar view)", async ({
      page,
    }) => {
      await page.goto("/dashboard/tasks");
      await assertZeroHorizontalOverflow(page, "Tasks Management (List View)");

      // Check task detail if any task link exists
      const taskLink = page.locator('a[href^="/dashboard/tasks/"]').first();
      if (await taskLink.isVisible()) {
        await taskLink.click();
        await page.waitForLoadState("domcontentloaded");
        await assertZeroHorizontalOverflow(page, "Task Detail View");
        await page.goto("/dashboard/tasks");
      }

      // Switch to calendar view if available
      const calTab = page.locator("button:has-text('Calendar')");
      if (await calTab.isVisible()) {
        await calTab.click();
        await page.waitForTimeout(400);
        await assertZeroHorizontalOverflow(
          page,
          "Tasks Management (Calendar View)"
        );
      }
    });

    test("Work Log page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/dashboard/work-log");
      await assertZeroHorizontalOverflow(page, "Work Log Page");
    });

    test("Leave requests page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/leave");
      await assertZeroHorizontalOverflow(page, "Leave Page");
    });

    test("Clients directory page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/clients");
      await assertZeroHorizontalOverflow(page, "Clients Page");
    });

    test("Shoots log and calendar page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/shoots");
      await assertZeroHorizontalOverflow(page, "Shoots Log Page");

      // Switch to calendar tab if available
      const calTab = page.locator("button:has-text('Shoots calendar')");
      if (await calTab.isVisible()) {
        await calTab.click();
        await page.waitForTimeout(400);
        await assertZeroHorizontalOverflow(page, "Shoots Calendar View");
      }
    });

    test("Deliveries calendar page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/deliveries");
      await assertZeroHorizontalOverflow(page, "Deliveries Calendar Page");
    });

    test("Messages chat page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/dashboard/messages");
      await assertZeroHorizontalOverflow(page, "Messages Chat Page");
    });

    test("Meetings page has zero horizontal overflow (Upcoming & Calendar view)", async ({
      page,
    }) => {
      await page.goto("/dashboard/meetings");
      await assertZeroHorizontalOverflow(page, "Meetings Page (Upcoming)");

      const calBtn = page.locator("button:has-text('Calendar')");
      if (await calBtn.isVisible()) {
        await calBtn.click();
        await page.waitForTimeout(400);
        await assertZeroHorizontalOverflow(page, "Meetings Page (Calendar)");
      }
    });

    test("Notifications page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/dashboard/notifications");
      await assertZeroHorizontalOverflow(page, "Notifications Page");
    });

    test("Profile page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/dashboard/profile");
      await assertZeroHorizontalOverflow(page, "Profile Page");
    });

    test("Reports analytics page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/reports");
      await assertZeroHorizontalOverflow(page, "Reports Page");
    });

    test("Transfers page has zero horizontal overflow", async ({ page }) => {
      await page.goto("/dashboard/transfers");
      await assertZeroHorizontalOverflow(page, "Transfers Page");
    });

    test("Holidays calendar page has zero horizontal overflow", async ({
      page,
    }) => {
      await page.goto("/dashboard/holidays");
      await assertZeroHorizontalOverflow(page, "Holidays Page");
    });
  });
});
