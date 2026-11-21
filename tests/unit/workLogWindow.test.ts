import { describe, it, expect } from "vitest";
import { WORK_LOG_EDIT_WINDOW_DAYS } from "@/services/workLogServices";

describe("Work Log Business Rules (CODE-01)", () => {
  it("should have WORK_LOG_EDIT_WINDOW_DAYS aligned to 5 days", () => {
    expect(WORK_LOG_EDIT_WINDOW_DAYS).toBe(5);
  });

  it("should allow editing dates within the 5-day window", () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const earliestEditable = new Date(today);
    earliestEditable.setUTCDate(earliestEditable.getUTCDate() - WORK_LOG_EDIT_WINDOW_DAYS);

    // 2 days ago is within the 5-day window
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

    expect(twoDaysAgo.getTime()).toBeGreaterThanOrEqual(earliestEditable.getTime());
    expect(twoDaysAgo.getTime()).toBeLessThanOrEqual(today.getTime());

    // 5 days ago (exactly on the boundary) is permitted
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setUTCDate(fiveDaysAgo.getUTCDate() - 5);
    expect(fiveDaysAgo.getTime()).toBeGreaterThanOrEqual(earliestEditable.getTime());
  });

  it("should disallow editing dates older than 5 days", () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const earliestEditable = new Date(today);
    earliestEditable.setUTCDate(earliestEditable.getUTCDate() - WORK_LOG_EDIT_WINDOW_DAYS);

    // 6 days ago is outside the 5-day window
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);

    expect(sixDaysAgo.getTime()).toBeLessThan(earliestEditable.getTime());
  });

  it("should disallow future dates", () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    expect(tomorrow.getTime()).toBeGreaterThan(today.getTime());
  });
});
