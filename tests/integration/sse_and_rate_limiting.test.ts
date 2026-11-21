import { describe, it, expect, beforeEach } from "vitest";
import {
  rateLimit,
  getClientKey,
  cleanupExpiredBuckets,
  _resetRateLimitBuckets,
  _getRateLimitStats,
} from "@/lib/rateLimit";

describe("Integration: Rate Limiter Stress & Header Spoofing Mitigation", () => {
  beforeEach(() => {
    _resetRateLimitBuckets();
    delete process.env.TRUST_PROXY;
    delete process.env.VERCEL;
  });

  describe("Header Spoofing Mitigation", () => {
    it("should ignore spoofed X-Forwarded-For when TRUST_PROXY is not configured", () => {
      const spoofedReq = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "198.51.100.99" },
      });
      // Untrusted environment must not trust random spoofed client IP
      expect(getClientKey(spoofedReq)).toBe("127.0.0.1");
    });

    it("should trust tamper-proof Cloudflare cf-connecting-ip header", () => {
      const cfReq = new Request("http://localhost/api/test", {
        headers: {
          "cf-connecting-ip": "203.0.113.88",
          "x-forwarded-for": "198.51.100.99",
        },
      });
      expect(getClientKey(cfReq)).toBe("203.0.113.88");
    });

    it("should trust X-Forwarded-For when TRUST_PROXY='true'", () => {
      process.env.TRUST_PROXY = "true";
      const proxyReq = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "192.0.2.146, 10.0.0.1" },
      });
      expect(getClientKey(proxyReq)).toBe("192.0.2.146");
    });
  });

  describe("Memory Stress & Capacity Management", () => {
    it("should handle large volume of unique keys without exceeding capacity", () => {
      const BATCH_SIZE = 1200;
      for (let i = 0; i < BATCH_SIZE; i++) {
        rateLimit(`client-stress-${i}`, 10, 60_000);
      }

      const stats = _getRateLimitStats();
      expect(stats.bucketCount).toBeLessThanOrEqual(stats.maxBuckets);
      expect(stats.bucketCount).toBe(BATCH_SIZE);
    });

    it("should sweep expired keys cleanly", () => {
      for (let i = 0; i < 50; i++) {
        rateLimit(`expired-stress-${i}`, 5, -100);
      }
      rateLimit("active-key-1", 5, 60_000);

      cleanupExpiredBuckets();
      const stats = _getRateLimitStats();
      expect(stats.bucketCount).toBe(1);
    });
  });
});
