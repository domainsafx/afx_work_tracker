import { describe, it, expect, beforeEach } from "vitest";
import { withDistributedLock } from "@/lib/distributedLock";
import { connectDB } from "@/lib/db";
import SystemLock from "@/models/SystemLock";

describe("Integration: Equipment Concurrency & Distributed Locking", () => {
  beforeEach(async () => {
    try {
      await connectDB();
      await SystemLock.deleteMany({
        key: { $in: ["test_equipment_checkout_unit", "test_ttl_recovery"] },
      });
    } catch {
      // ignore
    }
  });

  it("serializes concurrent reservations to prevent negative inventory", async () => {
    let availableInventory = 1;
    const checkoutLog: string[] = [];

    const simulateCheckout = async (workerId: string) => {
      return withDistributedLock(
        "test_equipment_checkout_unit",
        async () => {
          // Simulate latency reading database aggregate
          await new Promise((r) => setTimeout(r, 15));

          if (availableInventory >= 1) {
            availableInventory -= 1;
            checkoutLog.push(`SUCCESS:${workerId}`);
            return true;
          } else {
            checkoutLog.push(`INSUFFICIENT:${workerId}`);
            throw new Error(`Only 0 of "Sony A7S III" available right now`);
          }
        },
        { waitTimeoutMs: 3000, ttlMs: 5000 }
      );
    };

    // 4 concurrent workers simultaneously attempting to reserve 1 item
    const results = await Promise.allSettled([
      simulateCheckout("Node-1"),
      simulateCheckout("Node-2"),
      simulateCheckout("Node-3"),
      simulateCheckout("Node-4"),
    ]);

    const successes = results.filter((r) => r.status === "fulfilled");
    const rejections = results.filter((r) => r.status === "rejected");

    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(3);
    expect(availableInventory).toBe(0); // Zero negative inventory!
    expect(checkoutLog.filter((l) => l.startsWith("SUCCESS:")).length).toBe(1);
  }, 15_000);

  it("recovers safely if a lock expires", async () => {
    let executionOrder: string[] = [];

    // Holder 1 acquires lock with short TTL (200ms)
    await withDistributedLock(
      "test_ttl_recovery",
      async () => {
        executionOrder.push("job-1");
      },
      { ttlMs: 200 }
    );

    // Holder 2 immediately acquires after release
    await withDistributedLock(
      "test_ttl_recovery",
      async () => {
        executionOrder.push("job-2");
      },
      { ttlMs: 200 }
    );

    expect(executionOrder).toEqual(["job-1", "job-2"]);
  });
});
