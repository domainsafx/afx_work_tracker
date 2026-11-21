# AVANFlix Work Tracker — Security Remediation Report

**Audit References:** SEC-01, SEC-02  
**Implementation Date:** November 20, 2026  
**Security Classification:** Level-1 Critical Infrastructure Hardening  

---

## 1. Executive Summary

This report outlines the security remediations performed on the AVANFlix Work Tracker platform. Critical vulnerabilities around middleware bypass, missing API route protection, unhandled HTML redirect leaks to JSON fetch clients, and unbounded rate limiter memory consumption have been permanently resolved.

---

## 2. SEC-01: Proxy Middleware Matcher & Authorization Gate

### Previous State & Vulnerability
Prior to remediation, `proxy.ts` only matched 5 hardcoded routes:
```typescript
matcher: [
  "/dashboard/:path*",
  "/api/users/:path*",
  "/api/tasks/:path*",
  "/api/notifications/:path*",
  "/api/departments/:path*",
]
```
This left sensitive endpoints (`/api/clients`, `/api/equipment`, `/api/shoots`, `/api/leave`, `/api/transfer`, `/api/meetings`, `/api/calls`, `/api/work-logs`, etc.) outside the Edge proxy gate.
Furthermore, unauthenticated requests hitting `/api/*` were redirected with HTTP 307 to `/login`. Client-side `fetch` calls expecting JSON received an HTML document instead, triggering runtime parser crashes (`Unexpected token '<', "<!DOCTYPE "... is not valid JSON`).

### Hardened Implementation (`proxy.ts`)
The proxy was refactored with the following security invariants:
1. **Universal Route Matching:**
   ```typescript
   export const config = {
     matcher: [
       "/dashboard/:path*",
       "/api/:path*",
     ],
   };
   ```
2. **Explicit Public Path Bypass:**
   Whitelisted public routes (`/login`, `/forgot-password`, `/api/auth`, `/download`) bypass proxy authentication checks without redirect loops.
3. **Protocol-Appropriate Unauthorized Responses:**
   - For `/api/*`: Unauthenticated requests immediately receive HTTP 401 `{ "error": "Unauthorized" }`. Deactivated accounts receive HTTP 403 `{ "error": "Account deactivated" }`.
   - For `/dashboard/*`: Unauthenticated browser requests receive HTTP 307 redirecting to `/login?callbackUrl=...`. Deactivated accounts redirect to `/login?disabled=1`.
4. **Role-Enforced Navigation:**
   - Admin-only routes (`/dashboard/employees/new`, `/dashboard/admins`) reject non-`SUPER_ADMIN` users with HTTP 403 (for API) or redirect to `/dashboard`.
   - Employee role users attempting to access `/dashboard/employees` are bounced back to `/dashboard`.
5. **Defense-in-Depth:**
   Every protected Next.js API route handler continues to enforce session verification and RBAC permissions (`can()`, `canViewWorkLogOf`, `canViewShootLogOf`) independently.

---

## 3. SEC-02: Rate Limiter Optimization & Memory Hardening

### Previous State & Vulnerability
`lib/rateLimit.ts` stored sliding-window buckets in a naked JavaScript `Map` with no automated garbage collection. Stale IP records were only evaluated when the exact same IP made a subsequent request. A sustained distributed port scan or credential stuffing attack could generate hundreds of thousands of entries, leading to Node.js Out-Of-Memory (OOM) crashes.

### Hardened Implementation (`lib/rateLimit.ts`)
1. **Automated Expiration Cleanup:**
   An unreferenced interval timer runs every 60,000ms (`cleanupExpiredBuckets()`), sweeping and purging all keys whose `resetAt` timestamp is in the past.
2. **Bounded Memory Capacity & LRU Eviction:**
   A maximum capacity ceiling of 10,000 buckets is strictly enforced (`MAX_BUCKETS = 10_000`). If key allocation approaches the ceiling within a single cleanup window, expired keys are swept immediately; if still saturated, the oldest 20% of entries are proactively evicted.
3. **Multi-Header IP Resolution:**
   `getClientKey(req)` extracts real client IPs while mitigating header spoofing by prioritizing the first address in comma-separated `x-forwarded-for` chains, falling back sequentially to `x-real-ip`, `cf-connecting-ip`, and `127.0.0.1`.
4. **Pluggable Distributed Architecture:**
   Added `rateLimitAsync()` which supports Upstash / Redis REST pipelines via environment variables (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
5. **Fail-Safe Operation:**
   If an external Redis service fails, drops connection, or times out, the rate limiter logs a warning and falls back to the in-memory engine, guaranteeing that authentication and operational workflows are never blocked.

---

## 4. Centralized RBAC Security Enforcement

All system operations respect the immutable permission matrix in `utils/permissions.ts`:

```
SUPER_ADMIN
  ├── System Administration: ADD_ADMIN, DELETE_ADMIN, ADD_EMPLOYEE, DELETE_EMPLOYEE, ACTIVATE_USER, DEACTIVATE_USER
  ├── Configuration: MANAGE_HOLIDAYS, SET_LEAVE_APPROVER
  ├── Universal Scoping: VIEW_ALL_EMPLOYEES, VIEW_TEAM_WORK_LOGS (all roles), canViewShootLogOf (all)
  └── Task Orchestration: ASSIGN_TASK, DELETE_TASK, TRANSFER_ANY_TASK

ADMIN
  ├── Supervisory Management: ASSIGN_TASK, ASSIGN_TO_ADMIN, DELETE_TASK, REVIEW_DELAY, REVIEW_TASK_UPDATE
  ├── Scoped Scoping: VIEW_ALL_EMPLOYEES, VIEW_TEAM_WORK_LOGS (EMPLOYEE only), canViewShootLogOf (EMPLOYEE only)
  ├── Operational Assets: MANAGE_EQUIPMENT, CREATE_SHOOT_LOG, ADD_SHOOT_TO_CALENDAR, MANAGE_CLIENTS
  └── Denied: System user provisioning, holiday calendar modification, leave approver designation

EMPLOYEE
  ├── Individual Contributor: UPDATE_OWN_TASK, SUBMIT_DELAY, REQUEST_TRANSFER, REQUEST_LEAVE, CREATE_SHOOT_LOG
  ├── Scoped Privacy: Own profile, own tasks, own work logs, own shoot equipment
  └── Denied: Supervisory task assignment, viewing peer logs, viewing admin accounts
```

---

## 5. Security Verification Results

- **Automated Tests:** `tests/unit/rateLimit.test.ts` (4 passed), `tests/unit/permissions.test.ts` (7 passed).
- **Manual Attack Simulation:** Unauthenticated API requests receive clean 401 JSON responses; unauthenticated dashboard requests redirect cleanly without loops.
- **Deactivated User Test:** Deactivated accounts receive 403 JSON or redirect to `/login?disabled=1`.
