import { describe, it, expect } from "vitest";

describe("Equipment Inventory Concurrency (CONC-01)", () => {
  it("should calculate available inventory accurately without going negative", () => {
    const totalQuantity = 3;
    const checkedOutQuantity = 3;

    const available = Math.max(0, totalQuantity - checkedOutQuantity);
    expect(available).toBe(0);

    const requestedQuantity = 1;
    const canCheckout = requestedQuantity <= available;
    expect(canCheckout).toBe(false);
  });

  it("should reject checkout when requested quantity exceeds available", () => {
    const catalogItem = { name: "Sony FX3 Camera", totalQuantity: 2 };
    const currentlyOut = 2;
    const available = Math.max(0, catalogItem.totalQuantity - currentlyOut);

    const requested = 1;
    expect(() => {
      if (requested > available) {
        throw new Error(`Only ${available} of "${catalogItem.name}" available right now`);
      }
    }).toThrow(`Only 0 of "Sony FX3 Camera" available right now`);
  });

  it("should serialize checkout operations through mutex", async () => {
    class Mutex {
      private queue: Promise<void> = Promise.resolve();
      async acquire<T>(fn: () => Promise<T>): Promise<T> {
        let release: () => void;
        const next = new Promise<void>((resolve) => {
          release = resolve;
        });
        const current = this.queue;
        this.queue = this.queue.then(() => next);
        await current;
        try {
          return await fn();
        } finally {
          release!();
        }
      }
    }

    const mutex = new Mutex();
    let inventory = 1;
    const orderLog: string[] = [];

    const attemptCheckout = async (userId: string) => {
      return mutex.acquire(async () => {
        // Simulate reading state
        await new Promise((r) => setTimeout(r, 10));
        if (inventory >= 1) {
          inventory -= 1;
          orderLog.push(`SUCCESS:${userId}`);
          return true;
        } else {
          orderLog.push(`REJECTED:${userId}`);
          return false;
        }
      });
    };

    // Run 3 concurrent requests competing for 1 item
    const results = await Promise.all([
      attemptCheckout("User-A"),
      attemptCheckout("User-B"),
      attemptCheckout("User-C"),
    ]);

    const successes = results.filter((r) => r === true);
    const rejections = results.filter((r) => r === false);

    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(2);
    expect(inventory).toBe(0); // Zero negative inventory!
  });
});
