import { describe, it, expect } from "vitest";
import { createEmployeeSchema, updateEmployeeSchema } from "@/lib/validations";

describe("Integration: Employee Management & Validation", () => {
  it("enforces mandatory first name and last name for new employee creation", () => {
    const validData = {
      firstName: "Avan",
      lastName: "Flix",
      email: "avan.flix@avanflix.com",
      password: "SecurePassword123!",
      department: "Production",
      designation: "Cinematographer",
      joiningDate: "2026-02-01",
      role: "EMPLOYEE",
      phone: "+919876543210",
      whatsappOptIn: true,
    };

    const parsed = createEmployeeSchema.safeParse(validData);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      // Name derivation logic
      const fullName = parsed.data.name?.trim() || `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`.trim();
      expect(fullName).toBe("Avan Flix");
    }
  });

  it("rejects employee creation with missing or whitespace-only first or last name", () => {
    const invalidFirst = {
      firstName: "   ",
      lastName: "Editor",
      email: "test@avanflix.com",
      password: "SecurePassword123!",
      department: "Post-Production",
      designation: "Editor",
      joiningDate: "2026-02-01",
      role: "EMPLOYEE",
    };
    expect(createEmployeeSchema.safeParse(invalidFirst).success).toBe(false);

    const invalidLast = {
      firstName: "Editor",
      lastName: "",
      email: "test@avanflix.com",
      password: "SecurePassword123!",
      department: "Post-Production",
      designation: "Editor",
      joiningDate: "2026-02-01",
      role: "EMPLOYEE",
    };
    expect(createEmployeeSchema.safeParse(invalidLast).success).toBe(false);
  });

  it("rejects invalid email formats and weak passwords", () => {
    const badEmail = {
      firstName: "Jane",
      lastName: "Doe",
      email: "invalid-email-string",
      password: "Short",
      department: "Sound",
      designation: "Sound Engineer",
      joiningDate: "2026-02-01",
      role: "EMPLOYEE",
    };

    const result = createEmployeeSchema.safeParse(badEmail);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
    }
  });

  it("supports partial employee profile updates", () => {
    const updateInput = {
      firstName: "AvanUpdated",
      designation: "Lead Cinematographer",
    };
    const parsed = updateEmployeeSchema.safeParse(updateInput);
    expect(parsed.success).toBe(true);
  });
});
