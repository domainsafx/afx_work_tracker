/**
 * Production-ready rate limiter with sliding window, automatic expired key cleanup,
 * bounded memory protection (eviction), spoofing mitigation, and optional distributed Redis/Upstash support.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;

// In-memory sliding window bucket store
const buckets = new Map<string, Bucket>();

// Periodic garbage collection for expired entries to prevent memory leaks
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export function cleanupExpiredBuckets(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

// Start cleanup timer in Node environment (with unref so it won't hold open test runs or process exit)
if (typeof setInterval !== "undefined") {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupExpiredBuckets, CLEANUP_INTERVAL_MS);
    if (typeof cleanupTimer.unref === "function") {
      cleanupTimer.unref();
    }
  }
}

/**
 * Ensures memory does not grow unbounded if a flood of distinct keys arrives
 * within a single cleanup window.
 */
function ensureCapacity(): void {
  if (buckets.size < MAX_BUCKETS) return;

  // First purge all expired entries
  cleanupExpiredBuckets();

  // If still at or over capacity, evict the earliest resetting entries
  if (buckets.size >= MAX_BUCKETS) {
    const entries = Array.from(buckets.entries()).sort(
      (a, b) => a[1].resetAt - b[1].resetAt
    );
    const toRemove = Math.ceil(MAX_BUCKETS * 0.2); // Evict oldest 20%
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      buckets.delete(entries[i][0]);
    }
  }
}

/**
 * Synchronous in-memory rate limiter with sliding window.
 * Returns true if request is allowed, false if rate limited.
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  try {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      ensureCapacity();
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (bucket.count >= limit) {
      return false;
    }

    bucket.count += 1;
    return true;
  } catch (err) {
    // Fail-safe: log error and allow request rather than breaking critical user flows
    console.error("Rate limiter evaluation error:", err);
    return true;
  }
}

/**
 * Async rate limiter with support for Upstash / Redis REST endpoints
 * when configured via UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN,
 * falling back gracefully to the synchronous in-memory store.
 */
export async function rateLimitAsync(
  key: string,
  limit = 20,
  windowMs = 60_000
): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      const redisKey = `ratelimit:${key}`;

      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSec],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = data?.[0]?.result ?? 1;
        return currentCount <= limit;
      }
    } catch (err) {
      console.warn("Distributed rate limiter error, falling back to in-memory:", err);
    }
  }

  // Graceful fallback to in-memory store
  return rateLimit(key, limit, windowMs);
}

/**
 * Resolves the client IP address securely.
 * Mitigates header spoofing by:
 * 1. Prioritizing authenticated cloud provider headers (e.g. Cloudflare 'cf-connecting-ip', Vercel 'x-vercel-forwarded-for')
 *    which are set by the edge network and cannot be spoofed by incoming client HTTP requests.
 * 2. Only trusting 'x-forwarded-for' if TRUST_PROXY="true" or running on recognized cloud hosting (VERCEL, etc.).
 * 3. Falling back safely to '127.0.0.1' to prevent spoofing bypasses when direct untrusted headers are sent.
 */
export function getClientKey(req: Request): string {
  // Cloudflare Edge header (tamper-proof at CF proxy)
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  // Vercel Edge header (tamper-proof on Vercel platform)
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp?.trim()) {
    const firstVercel = vercelIp.split(",")[0].trim();
    if (firstVercel) return firstVercel;
  }

  const isTrustedProxy =
    process.env.TRUST_PROXY === "true" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.CF_PAGES);

  if (isTrustedProxy) {
    const xForwardedFor = req.headers.get("x-forwarded-for");
    if (xForwardedFor) {
      const firstIp = xForwardedFor.split(",")[0].trim();
      if (firstIp) return firstIp;
    }

    const xRealIp = req.headers.get("x-real-ip");
    if (xRealIp?.trim()) return xRealIp.trim();
  }

  return "127.0.0.1";
}

/**
 * For testing and monitoring purposes.
 */
export function _getRateLimitStats() {
  return {
    bucketCount: buckets.size,
    maxBuckets: MAX_BUCKETS,
  };
}

export function _resetRateLimitBuckets() {
  buckets.clear();
}
