import { describe, it, expect } from "vitest";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validations";

describe("Employee Data Validation (User Story 5)", () => {
  it("should validate and accept valid employee with first and last name", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@avanflix.com",
      password: "StrongPassword123!",
      department: "Post-Production",
      designation: "Senior Video Editor",
      joiningDate: "2026-01-15",
      role: "EMPLOYEE",
      phone: "+919876543210",
      whatsappOptIn: true,
    };

    const result = createEmployeeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe("John");
      expect(result.data.lastName).toBe("Doe");
    }
  });

  it("should reject employee creation missing firstName or lastName", () => {
    const missingFirstName = {
      firstName: "",
      lastName: "Doe",
      email: "john.doe@avanflix.com",
      password: "StrongPassword123!",
      department: "Post-Production",
      designation: "Senior Video Editor",
      joiningDate: "2026-01-15",
      role: "EMPLOYEE",
    };

    const res1 = createEmployeeSchema.safeParse(missingFirstName);
    expect(res1.success).toBe(false);

    const missingLastName = {
      firstName: "John",
      lastName: "   ",
      email: "john.doe@avanflix.com",
      password: "StrongPassword123!",
      department: "Post-Production",
      designation: "Senior Video Editor",
      joiningDate: "2026-01-15",
      role: "EMPLOYEE",
    };

    const res2 = createEmployeeSchema.safeParse(missingLastName);
    expect(res2.success).toBe(false);
  });

  it("should validate and allow partial updates with updateEmployeeSchema", () => {
    const update = {
      firstName: "Jane",
      lastName: "Smith",
      designation: "Lead Editor",
    };

    const result = updateEmployeeSchema.safeParse(update);
    expect(result.success).toBe(true);
  });
});
