import crypto from "crypto";
import { connectDB } from "@/lib/db";
import SystemLock from "@/models/SystemLock";

interface DistributedLockOptions {
  ttlMs?: number;
  waitTimeoutMs?: number;
  retryIntervalMs?: number;
}

const instanceId = `${process.pid}-${crypto.randomBytes(4).toString("hex")}`;

// In-memory fallback mutex if MongoDB is unreachable
const memoryLocks = new Map<string, { token: string; expiresAt: number }>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempts to acquire an atomic distributed lock in MongoDB across all instances.
 */
export async function acquireDistributedLock(
  key: string,
  ttlMs = 15_000,
  waitTimeoutMs = 5_000,
  retryIntervalMs = 100
): Promise<string | null> {
  const token = `${instanceId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const startTime = Date.now();

  let hasDB = false;
  try {
    await connectDB();
    hasDB = Boolean(SystemLock.collection);
  } catch {
    hasDB = false;
  }

  while (Date.now() - startTime <= waitTimeoutMs) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    if (hasDB) {
      try {
        // Check if an unexpired lock is currently active
        const existing = await SystemLock.findOne({ key }).lean();
        if (
          existing &&
          (existing as any).lockedUntil &&
          new Date((existing as any).lockedUntil).getTime() > now.getTime()
        ) {
          // Lock is actively held; wait and retry
        } else {
          // Lock is free or expired: update atomically
          const lock = await SystemLock.findOneAndUpdate(
            {
              key,
              $or: [
                { lockedUntil: { $lte: now } },
                { lockedUntil: null },
              ],
            },
            {
              $set: {
                key,
                lockedBy: token,
                lockedAt: now,
                lockedUntil: expiresAt,
              },
            },
            { new: true }
          );

          if (lock && (lock as any).lockedBy === token) {
            return token;
          }

          if (!existing) {
            try {
              const created = await SystemLock.create({
                key,
                lockedBy: token,
                lockedAt: now,
                lockedUntil: expiresAt,
              });
              if (created && (created as any).lockedBy === token) {
                return token;
              }
            } catch (err: any) {
              if (err?.code !== 11000) {
                console.warn("[DistributedLock] create error:", err);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[DistributedLock] DB acquisition error, using memory lock:", err);
        return acquireMemoryLock(key, token, ttlMs);
      }
    } else {
      const memToken = acquireMemoryLock(key, token, ttlMs);
      if (memToken) return memToken;
    }

    // Wait with jitter before retrying
    const jitter = Math.floor(Math.random() * 50);
    await sleep(retryIntervalMs + jitter);
  }

  return null;
}

/**
 * Releases the distributed lock only if owned by the caller token.
 */
export async function releaseDistributedLock(key: string, token: string): Promise<boolean> {
  try {
    await connectDB();
    const result = await SystemLock.updateOne(
      { key, lockedBy: token },
      { $set: { lockedUntil: new Date(0) } }
    );
    return (result.modifiedCount || 0) > 0;
  } catch {
    return releaseMemoryLock(key, token);
  }
}

/**
 * Executes an async function inside a distributed lock, guaranteeing single-execution
 * across all running Node processes and application instances.
 */
export async function withDistributedLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: DistributedLockOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? 15_000;
  const waitTimeoutMs = options.waitTimeoutMs ?? 5_000;
  const retryIntervalMs = options.retryIntervalMs ?? 100;

  const token = await acquireDistributedLock(key, ttlMs, waitTimeoutMs, retryIntervalMs);
  if (!token) {
    throw new Error(
      `Could not acquire distributed lock for "${key}". Another instance is currently executing this operation.`
    );
  }

  try {
    return await fn();
  } finally {
    await releaseDistributedLock(key, token).catch((err) => {
      console.warn(`[DistributedLock] Failed to release lock "${key}":`, err);
    });
  }
}

function acquireMemoryLock(key: string, token: string, ttlMs: number): string | null {
  const now = Date.now();
  const current = memoryLocks.get(key);
  if (!current || now > current.expiresAt) {
    memoryLocks.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }
  return null;
}

function releaseMemoryLock(key: string, token: string): boolean {
  const current = memoryLocks.get(key);
  if (current && current.token === token) {
    memoryLocks.delete(key);
    return true;
  }
  return false;
}
