import { describe, it, expect } from "vitest";
import {
  can,
  canViewWorkLogOf,
  canViewShootLogOf,
  getWorkLogVisibleRoles,
  PERMISSIONS,
} from "@/utils/permissions";

describe("Role-Based Access Control (RBAC)", () => {
  describe("can() permission checks", () => {
    it("SUPER_ADMIN should have administrative privileges", () => {
      expect(can("SUPER_ADMIN", "ADD_ADMIN")).toBe(true);
      expect(can("SUPER_ADMIN", "ADD_EMPLOYEE")).toBe(true);
      expect(can("SUPER_ADMIN", "DEACTIVATE_USER")).toBe(true);
      expect(can("SUPER_ADMIN", "ASSIGN_TASK")).toBe(true);
      expect(can("SUPER_ADMIN", "MANAGE_HOLIDAYS")).toBe(true);
      expect(can("SUPER_ADMIN", "SET_LEAVE_APPROVER")).toBe(true);
    });

    it("ADMIN should have operational supervisory privileges but not system-level administration", () => {
      expect(can("ADMIN", "ASSIGN_TASK")).toBe(true);
      expect(can("ADMIN", "VIEW_ALL_EMPLOYEES")).toBe(true);
      expect(can("ADMIN", "MANAGE_EQUIPMENT")).toBe(true);
      expect(can("ADMIN", "MANAGE_CLIENTS")).toBe(true);

      // Denied system admin actions
      expect(can("ADMIN", "ADD_ADMIN")).toBe(false);
      expect(can("ADMIN", "DELETE_ADMIN")).toBe(false);
      expect(can("ADMIN", "ADD_EMPLOYEE")).toBe(false);
      expect(can("ADMIN", "MANAGE_HOLIDAYS")).toBe(false);
      expect(can("ADMIN", "SET_LEAVE_APPROVER")).toBe(false);
    });

    it("EMPLOYEE should only have individual contributor capabilities", () => {
      expect(can("EMPLOYEE", "UPDATE_OWN_TASK")).toBe(true);
      expect(can("EMPLOYEE", "REQUEST_LEAVE")).toBe(true);
      expect(can("EMPLOYEE", "CREATE_SHOOT_LOG")).toBe(true);

      // Denied supervisory actions
      expect(can("EMPLOYEE", "ASSIGN_TASK")).toBe(false);
      expect(can("EMPLOYEE", "DELETE_TASK")).toBe(false);
      expect(can("EMPLOYEE", "VIEW_ALL_EMPLOYEES")).toBe(false);
      expect(can("EMPLOYEE", "MANAGE_EQUIPMENT")).toBe(false);
      expect(can("EMPLOYEE", "ADD_EMPLOYEE")).toBe(false);
    });

    it("should reject undefined or empty role", () => {
      expect(can(undefined, "ASSIGN_TASK")).toBe(false);
    });
  });

  describe("Work Log & Shoot Log Scoping Hierarchy", () => {
    it("SUPER_ADMIN can view logs of everyone", () => {
      const visibleRoles = getWorkLogVisibleRoles("SUPER_ADMIN");
      expect(visibleRoles).toContain("ADMIN");
      expect(visibleRoles).toContain("EMPLOYEE");

      expect(canViewWorkLogOf("SUPER_ADMIN", "sa-1", "emp-1", "EMPLOYEE")).toBe(true);
      expect(canViewWorkLogOf("SUPER_ADMIN", "sa-1", "adm-1", "ADMIN")).toBe(true);
    });

    it("ADMIN can view own logs and EMPLOYEE logs, but not other ADMINs", () => {
      const visibleRoles = getWorkLogVisibleRoles("ADMIN");
      expect(visibleRoles).toContain("EMPLOYEE");
      expect(visibleRoles).not.toContain("ADMIN");

      // Own log
      expect(canViewWorkLogOf("ADMIN", "adm-1", "adm-1", "ADMIN")).toBe(true);
      // Subordinate employee log
      expect(canViewWorkLogOf("ADMIN", "adm-1", "emp-1", "EMPLOYEE")).toBe(true);
      // Peer admin log (forbidden)
      expect(canViewWorkLogOf("ADMIN", "adm-1", "adm-2", "ADMIN")).toBe(false);
      // Super admin log (forbidden)
      expect(canViewWorkLogOf("ADMIN", "adm-1", "sa-1", "SUPER_ADMIN")).toBe(false);
    });

    it("EMPLOYEE can only view their own logs", () => {
      expect(getWorkLogVisibleRoles("EMPLOYEE")).toEqual([]);

      // Own log
      expect(canViewWorkLogOf("EMPLOYEE", "emp-1", "emp-1", "EMPLOYEE")).toBe(true);
      // Another employee log (forbidden)
      expect(canViewWorkLogOf("EMPLOYEE", "emp-1", "emp-2", "EMPLOYEE")).toBe(false);
      // Admin log (forbidden)
      expect(canViewWorkLogOf("EMPLOYEE", "emp-1", "adm-1", "ADMIN")).toBe(false);
    });
  });
});
