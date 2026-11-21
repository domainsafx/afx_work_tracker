# AVANFlix Work Tracker — Onboarding RBAC Matrix

**Module:** Role-Based Access Control Integration  
**File Reference:** `utils/permissions.ts` Extension  
**Status:** Approved Phase 0 Specification  

---

## 1. Role Definitions & Access Boundaries

The onboarding subsystem seamlessly extends the centralized RBAC matrix in `utils/permissions.ts` while maintaining strict zero-trust data segregation:

1. **SUPER_ADMIN (Executive Authority):**
   - Full end-to-end administration across all recruitment and onboarding pipelines.
   - Exclusive authority to create candidates, assign coordinators, and grant final employee account provisioning.
   - Sole authority to execute administrative overrides (e.g. bypass, force-approval, termination) with mandatory audit log attribution.

2. **ADMIN (Operational Supervisor & HR Coordinator):**
   - Manages candidates assigned to their department or assigned directly to them.
   - Reviews and verifies KYC documents, personal details, and banking information.
   - Approves applications, triggers document generation, and verifies signed NDA/NOC agreements.

3. **EMPLOYEE (Restricted Task Assignee / Peer Buddy):**
   - When an Employee is assigned an onboarding coordination task (e.g. buddy system, equipment setup, peer orientation), they receive strictly scoped access.
   - **Crucial Privacy Boundary:** Assigned employees can see candidate contact details, designation, and task checklists, but are **strictly barred** from viewing sensitive identity proofs (Aadhaar, PAN) or banking details.
   - Cannot generate employee IDs or finalize user creation.

4. **CANDIDATE (External Context):**
   - Zero access to internal `/dashboard/*` or standard `/api/*` endpoints.
   - Restricted exclusively to public `/onboard/[token]` routes authenticated via single-purpose, cryptographically signed tokens.

---

## 2. Onboarding Permissions Matrix

| Permission Key | Description | `SUPER_ADMIN` | `ADMIN` | `EMPLOYEE` | `CANDIDATE` |
|---|---|:---:|:---:|:---:|:---:|
| `CREATE_CANDIDATE` | Create new candidate profile & initiate onboarding | **YES** | NO | NO | NO |
| `ASSIGN_ONBOARDING_TASK` | Delegate onboarding coordinator duties | **YES** | NO | NO | NO |
| `VIEW_ALL_CANDIDATES` | Browse company-wide recruitment directory | **YES** | NO | NO | NO |
| `VIEW_ASSIGNED_CANDIDATES` | View candidates assigned to self | **YES** | **YES** | **YES** | NO |
| `REVIEW_CANDIDATE_INFO` | Inspect general personal & employment info | **YES** | **YES** | **YES** | NO |
| `VIEW_CANDIDATE_IDENTITY_KYC`| View Aadhaar, PAN numbers and card images | **YES** | **YES** | NO *(Denied)* | NO |
| `VIEW_CANDIDATE_BANK_DETAILS`| View bank account numbers, IFSC, passbook | **YES** | **YES** | NO *(Denied)* | NO |
| `REQUEST_CORRECTION` | Issue feedback requesting corrected uploads | **YES** | **YES** | NO | NO |
| `REJECT_CANDIDATE` | Terminate candidate application | **YES** | **YES** | NO | NO |
| `APPROVE_APPLICATION` | Approve initial application & KYC info | **YES** | **YES** | NO | NO |
| `GENERATE_OFFER_DOCS` | Trigger Offer and Joining letter generation | **YES** | **YES** | NO | NO |
| `VERIFY_SIGNED_DOCS` | Inspect & confirm signed NDA and NOC | **YES** | **YES** | NO | NO |
| `GENERATE_EMPLOYEE_ID` | Execute employee ID algorithm (`DW0008449`) | **YES** | NO | NO | NO |
| `CREATE_EMPLOYEE_ACCOUNT`| Create final active User account in system | **YES** | NO | NO | NO |
| `OVERRIDE_ONBOARDING` | Administrative override of pipeline states | **YES** | NO | NO | NO |
| `SUBMIT_OWN_APPLICATION` | Submit onboarding form & upload KYC | NO | NO | NO | **YES** (Via Token) |
| `DOWNLOAD_OWN_OFFER` | Retrieve personalized offer & joining letters | NO | NO | NO | **YES** (Via Token) |
| `UPLOAD_OWN_SIGNED_DOCS` | Upload signed NDA and NOC agreements | NO | NO | NO | **YES** (Via Token) |

---

## 3. Code Implementation Proposal (`utils/permissions.ts`)

```typescript
// Proposed extension to utils/permissions.ts (Zero changes to existing keys)
export const PERMISSIONS = {
  // Existing permissions preserved...
  ADD_ADMIN: ["SUPER_ADMIN"],
  DELETE_ADMIN: ["SUPER_ADMIN"],
  ADD_EMPLOYEE: ["SUPER_ADMIN"],
  // ...
  
  // Onboarding Subsystem Permissions
  CREATE_CANDIDATE: ["SUPER_ADMIN"],
  ASSIGN_ONBOARDING_TASK: ["SUPER_ADMIN"],
  VIEW_ALL_CANDIDATES: ["SUPER_ADMIN"],
  VIEW_ASSIGNED_CANDIDATES: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"],
  VIEW_CANDIDATE_IDENTITY_KYC: ["SUPER_ADMIN", "ADMIN"],
  VIEW_CANDIDATE_BANK_DETAILS: ["SUPER_ADMIN", "ADMIN"],
  REVIEW_CANDIDATE_APPLICATION: ["SUPER_ADMIN", "ADMIN"],
  APPROVE_CANDIDATE_APPLICATION: ["SUPER_ADMIN", "ADMIN"],
  REJECT_CANDIDATE: ["SUPER_ADMIN", "ADMIN"],
  REQUEST_CANDIDATE_CORRECTION: ["SUPER_ADMIN", "ADMIN"],
  GENERATE_OFFER_DOCUMENTS: ["SUPER_ADMIN", "ADMIN"],
  VERIFY_SIGNED_DOCUMENTS: ["SUPER_ADMIN", "ADMIN"],
  GENERATE_EMPLOYEE_ID: ["SUPER_ADMIN"],
  CREATE_EMPLOYEE_ACCOUNT: ["SUPER_ADMIN"],
  OVERRIDE_ONBOARDING_DECISION: ["SUPER_ADMIN"],
} as const satisfies Record<string, readonly UserRole[]>;
```

---

## 4. API Route Guard Verification

Every new onboarding API route handler enforces:
1. **Edge Proxy Protection:** `/dashboard/onboarding/:path*` and `/api/onboarding/:path*` covered by `proxy.ts`.
2. **Server-Side Authorization:** `auth()` verification followed by `can(role, PERMISSION_KEY)`.
3. **Data Scoping Guard:**
   - Super Admin: Unrestricted access.
   - Admin: Verified against `candidate.assignedTo === session.user.id || candidate.department === session.user.department`.
   - Employee: Verified against `candidate.assignedTo === session.user.id`. Sensitive fields (`aadhaar`, `pan`, `bankDetails`) are stripped from the response payload before serializing to JSON.
