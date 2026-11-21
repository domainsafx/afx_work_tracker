import { describe, it, expect, beforeEach } from "vitest";
import {
  rateLimit,
  getClientKey,
  cleanupExpiredBuckets,
  _resetRateLimitBuckets,
  _getRateLimitStats,
} from "@/lib/rateLimit";

describe("Rate Limiter (SEC-02)", () => {
  beforeEach(() => {
    _resetRateLimitBuckets();
  });

  it("should allow requests within limit and block when exceeded", () => {
    const key = "test-user-1";
    const limit = 3;
    const windowMs = 5000;

    expect(rateLimit(key, limit, windowMs)).toBe(true);
    expect(rateLimit(key, limit, windowMs)).toBe(true);
    expect(rateLimit(key, limit, windowMs)).toBe(true);
    // 4th request exceeds limit of 3
    expect(rateLimit(key, limit, windowMs)).toBe(false);
  });

  it("should track separate keys independently", () => {
    const key1 = "client-a";
    const key2 = "client-b";

    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key1, 5, 10000)).toBe(true);
    }
    // key1 is now blocked
    expect(rateLimit(key1, 5, 10000)).toBe(false);

    // key2 should still be allowed
    expect(rateLimit(key2, 5, 10000)).toBe(true);
  });

  it("should clean up expired buckets", () => {
    // Insert with negative / expired timestamp
    rateLimit("expired-key-1", 1, -100);
    rateLimit("expired-key-2", 1, -200);

    // Insert valid key
    rateLimit("valid-key", 1, 60000);

    cleanupExpiredBuckets();

    const stats = _getRateLimitStats();
    expect(stats.bucketCount).toBe(1);
  });

  it("should extract client IP correctly from headers", () => {
    process.env.TRUST_PROXY = "true";
    const reqWithForwarded = new Request("http://localhost/api/test", {
      headers: { "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178" },
    });
    expect(getClientKey(reqWithForwarded)).toBe("203.0.113.195");

    const reqWithRealIp = new Request("http://localhost/api/test", {
      headers: { "x-real-ip": "198.51.100.42" },
    });
    expect(getClientKey(reqWithRealIp)).toBe("198.51.100.42");

    delete process.env.TRUST_PROXY;
    const reqFallback = new Request("http://localhost/api/test");
    expect(getClientKey(reqFallback)).toBe("127.0.0.1");
  });
});
