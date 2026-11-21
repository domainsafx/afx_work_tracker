import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Task from "@/models/Task";
import { withDistributedLock } from "@/lib/distributedLock";

interface ReconciliationResult {
  leaveActivated: number;
  leaveExpired: number;
  tasksDelayed: number;
  durationMs: number;
  timestamp: string;
}

let lastReconciledAt: Date | null = null;

export const reconciliationService = {
  /**
   * Idempotent reconciliation of approved employee leave windows.
   * Promotes users into ON_LEAVE when today is within their approved window,
   * and demotes them back to ACTIVE once the window has passed.
   */
  async reconcileLeaveWindows(): Promise<{ activated: number; expired: number }> {
    await connectDB();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activatedResult, expiredResult] = await Promise.all([
      User.updateMany(
        {
          availabilityStatus: { $ne: "ON_LEAVE" },
          leaveFrom: { $lte: today },
          leaveTo: { $gte: today },
        },
        { $set: { availabilityStatus: "ON_LEAVE", availability: "ON_LEAVE" } }
      ),
      User.updateMany(
        {
          availabilityStatus: "ON_LEAVE",
          leaveTo: { $lt: today },
        },
        {
          $set: {
            availabilityStatus: "ACTIVE",
            availability: "AVAILABLE",
            leaveFrom: null,
            leaveTo: null,
            leaveReason: "",
          },
        }
      ),
    ]);

    return {
      activated: activatedResult.modifiedCount || 0,
      expired: expiredResult.modifiedCount || 0,
    };
  },

  /**
   * Idempotent reconciliation of overdue tasks.
   * Identifies tasks whose deadline has passed that are not in terminal or already delayed state,
   * updates status to DELAYED and records a timeline entry.
   */
  async reconcileOverdueTasks(): Promise<number> {
    await connectDB();

    const now = new Date();
    const todayUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const result = await Task.updateMany(
      {
        deadline: { $lt: todayUTC },
        status: { $nin: ["COMPLETED", "DELAYED", "CANCELLED"] },
      },
      {
        $set: { status: "DELAYED" },
        $push: {
          timeline: {
            timestamp: new Date(),
            author: null,
            authorName: "System",
            action: "Task automatically marked as delayed because the deadline has passed.",
          },
        },
      }
    );

    return result.modifiedCount || 0;
  },

  /**
   * Runs complete system reconciliation with distributed cross-instance concurrency locking.
   */
  async reconcileAll(): Promise<ReconciliationResult> {
    return withDistributedLock(
      "system_reconciliation",
      async () => {
        const startTime = performance.now();
        const [leaveStats, tasksDelayed] = await Promise.all([
          this.reconcileLeaveWindows(),
          this.reconcileOverdueTasks(),
        ]);

        const durationMs = Math.round(performance.now() - startTime);
        lastReconciledAt = new Date();

        const summary: ReconciliationResult = {
          leaveActivated: leaveStats.activated,
          leaveExpired: leaveStats.expired,
          tasksDelayed,
          durationMs,
          timestamp: lastReconciledAt.toISOString(),
        };

        console.log("[Reconciliation] Completed successfully:", summary);
        return summary;
      },
      { ttlMs: 60_000, waitTimeoutMs: 1_000 }
    );
  },

  getLastReconciledAt() {
    return lastReconciledAt;
  },
};
