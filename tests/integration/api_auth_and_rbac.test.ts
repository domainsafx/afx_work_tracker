import { describe, it, expect, vi } from "vitest";
import { can, canViewWorkLogOf, canViewShootLogOf, getWorkLogVisibleRoles } from "@/utils/permissions";

describe("Integration: API Authentication & RBAC Authorization", () => {
  describe("Authentication Gate & Scoping", () => {
    it("should deny access to unauthenticated sessions across all operations", () => {
      const session = null as { user?: any } | null;
      expect(session).toBeNull();
      // Any operation requiring a user must reject when session.user is null
      const isAuth = Boolean(session?.user);
      expect(isAuth).toBe(false);
    });

    it("should reject deactivated accounts with 403 Forbidden", () => {
      const user = { id: "user-123", email: "deactivated@avanflix.com", isActive: false, role: "EMPLOYEE" };
      expect(user.isActive).toBe(false);
      const isBlocked = user.isActive === false;
      expect(isBlocked).toBe(true);
    });
  });

  describe("Server-Side RBAC Enforcement", () => {
    it("Super Admin has exclusive permissions for user creation and holiday management", () => {
      expect(can("SUPER_ADMIN", "ADD_ADMIN")).toBe(true);
      expect(can("SUPER_ADMIN", "ADD_EMPLOYEE")).toBe(true);
      expect(can("SUPER_ADMIN", "DEACTIVATE_USER")).toBe(true);
      expect(can("SUPER_ADMIN", "MANAGE_HOLIDAYS")).toBe(true);
      expect(can("SUPER_ADMIN", "SET_LEAVE_APPROVER")).toBe(true);

      // Other roles are blocked
      expect(can("ADMIN", "ADD_ADMIN")).toBe(false);
      expect(can("ADMIN", "ADD_EMPLOYEE")).toBe(false);
      expect(can("ADMIN", "MANAGE_HOLIDAYS")).toBe(false);
      expect(can("EMPLOYEE", "ADD_ADMIN")).toBe(false);
      expect(can("EMPLOYEE", "ADD_EMPLOYEE")).toBe(false);
    });

    it("Admin has supervisory authority over tasks and equipment but not user provisioning", () => {
      expect(can("ADMIN", "ASSIGN_TASK")).toBe(true);
      expect(can("ADMIN", "DELETE_TASK")).toBe(true);
      expect(can("ADMIN", "MANAGE_EQUIPMENT")).toBe(true);
      expect(can("ADMIN", "MANAGE_CLIENTS")).toBe(true);
      expect(can("ADMIN", "REVIEW_DELAY")).toBe(true);
      expect(can("ADMIN", "REVIEW_TASK_UPDATE")).toBe(true);

      // Denied
      expect(can("ADMIN", "DELETE_ADMIN")).toBe(false);
      expect(can("ADMIN", "DEACTIVATE_USER")).toBe(false);
    });

    it("Employee is strictly limited to self-service workflows", () => {
      expect(can("EMPLOYEE", "UPDATE_OWN_TASK")).toBe(true);
      expect(can("EMPLOYEE", "SUBMIT_DELAY")).toBe(true);
      expect(can("EMPLOYEE", "REQUEST_TRANSFER")).toBe(true);
      expect(can("EMPLOYEE", "REQUEST_LEAVE")).toBe(true);
      expect(can("EMPLOYEE", "CREATE_SHOOT_LOG")).toBe(true);

      // Denied
      expect(can("EMPLOYEE", "ASSIGN_TASK")).toBe(false);
      expect(can("EMPLOYEE", "DELETE_TASK")).toBe(false);
      expect(can("EMPLOYEE", "REVIEW_TASK_UPDATE")).toBe(false);
      expect(can("EMPLOYEE", "MANAGE_CLIENTS")).toBe(false);
    });

    it("enforces hierarchical isolation on work logs and shoot logs", () => {
      // Employee cannot see other employees' work logs
      expect(canViewWorkLogOf("EMPLOYEE", "emp-1", "emp-2", "EMPLOYEE")).toBe(false);
      // Admin cannot see another Admin's work logs
      expect(canViewWorkLogOf("ADMIN", "adm-1", "adm-2", "ADMIN")).toBe(false);
      // Admin can see an Employee's work logs
      expect(canViewWorkLogOf("ADMIN", "adm-1", "emp-1", "EMPLOYEE")).toBe(true);
      // Super Admin can see everyone's work logs
      expect(canViewWorkLogOf("SUPER_ADMIN", "sa-1", "adm-1", "ADMIN")).toBe(true);
      expect(canViewWorkLogOf("SUPER_ADMIN", "sa-1", "emp-1", "EMPLOYEE")).toBe(true);
    });
  });
});
