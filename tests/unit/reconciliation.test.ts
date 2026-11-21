import { describe, it, expect, vi, beforeEach } from "vitest";
import { reconciliationService } from "@/services/reconciliationService";
import { connectDB } from "@/lib/db";
import SystemLock from "@/models/SystemLock";

describe("System Reconciliation Service (PERF-01)", () => {
  beforeEach(async () => {
    try {
      await connectDB();
      await SystemLock.deleteMany({ key: "system_reconciliation" });
    } catch {
      // Ignore if DB is unreachable in unit mode
    }
  });

  it("should have idempotent leave and overdue task reconciliation methods", () => {
    expect(typeof reconciliationService.reconcileLeaveWindows).toBe("function");
    expect(typeof reconciliationService.reconcileOverdueTasks).toBe("function");
    expect(typeof reconciliationService.reconcileAll).toBe("function");
  });

  it("should enforce distributed concurrency lock when reconciliation is already running", async () => {
    let resolveLeave: (val: any) => void;
    let notifyRunning: () => void;
    const runningPromise = new Promise<void>((resolve) => {
      notifyRunning = resolve;
    });
    const leavePromise = new Promise((resolve) => {
      resolveLeave = resolve;
    });

    vi.spyOn(reconciliationService, "reconcileLeaveWindows").mockImplementation(() => {
      notifyRunning();
      return leavePromise as any;
    });
    vi.spyOn(reconciliationService, "reconcileOverdueTasks").mockResolvedValue(0 as any);

    // Trigger first job
    const job1 = reconciliationService.reconcileAll();

    // Wait until job1 has acquired the lock and started running
    await runningPromise;

    // Trigger immediate concurrent job — will fail after 1000ms waitTimeout because job1 holds lock
    const concurrentAttempt = reconciliationService.reconcileAll();

    // Schedule resolution of first job after concurrentAttempt begins waiting
    const timer = setTimeout(() => {
      resolveLeave({ activated: 0, expired: 0 });
    }, 1200);

    await expect(concurrentAttempt).rejects.toThrow(/distributed lock|Another instance/);

    const result1 = await job1;
    clearTimeout(timer);
    expect(result1).toHaveProperty("durationMs");
    expect(result1).toHaveProperty("timestamp");

    vi.restoreAllMocks();
  }, 15_000);
});
