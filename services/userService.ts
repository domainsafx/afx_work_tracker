import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { UserRole } from "@/types";

export interface UserQueryOptions {
  search?: string;
  department?: string;
  role?: UserRole | UserRole[];
  isActive?: boolean;
  page?: number;
  limit?: number;
  availabilityStatus?: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
}

/**
 * Generates the next employee ID.
 * Example:
 * EMP-0001
 * EMP-0002
 * EMP-0003
 */
async function getNextEmployeeId() {
  const users = await User.find({}, { employeeId: 1 }).lean();

  let max = 0;

  for (const user of users) {
    if (!user.employeeId) continue;

    const number = parseInt(
      user.employeeId.replace("EMP-", ""),
      10
    );

    if (!isNaN(number) && number > max) {
      max = number;
    }
  }

  return `EMP-${String(max + 1).padStart(4, "0")}`;
}

import { reconciliationService } from "./reconciliationService";

/**
 * Reconciles leave windows via the reconciliation service.
 * Separated from ordinary read paths for optimal database performance.
 */
async function reconcileLeaveWindows() {
  return reconciliationService.reconcileLeaveWindows();
}

/**
 * Repository-style data access layer for Users.
 */
export const userService = {
  reconcileLeaveWindows,

  async list(options: UserQueryOptions = {}) {
    await connectDB();

    const {
      search,
      department,
      role,
      isActive,
      availabilityStatus,
      page = 1,
      limit = 20,
    } = options;

    const filter: Record<string, unknown> = {};

    if (department) filter.department = department;
    if (role) filter.role = Array.isArray(role) ? { $in: role } : role;
    if (typeof isActive === "boolean") filter.isActive = isActive;
    if (availabilityStatus) {
      filter.availabilityStatus = availabilityStatus;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
    };
  },

  async findById(id: string) {
    await connectDB();
    return User.findById(id).lean();
  },

  async findByEmail(email: string) {
    await connectDB();
    return User.findOne({
      email: email.toLowerCase(),
    }).lean();
  },

  async create(input: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    password: string;
    role: UserRole;
    department?: string;
    designation?: string;
    joiningDate?: string;
    employeeId?: string;
    phone?: string;
    whatsappOptIn?: boolean;
  }) {
    await connectDB();

    const existing = await User.findOne({
      email: input.email.toLowerCase(),
    });

    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const employeeId =
      input.employeeId ?? (await getNextEmployeeId());

    const fullName =
      input.name?.trim() ||
      [input.firstName?.trim(), input.lastName?.trim()].filter(Boolean).join(" ") ||
      "Employee";

    const user = await User.create({
      name: fullName,
      firstName: input.firstName?.trim() || undefined,
      lastName: input.lastName?.trim() || undefined,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      department: input.department,
      designation: input.designation,
      joiningDate: input.joiningDate
        ? new Date(input.joiningDate)
        : undefined,
      employeeId,
      isActive: true,
      phone: input.phone || undefined,
      whatsappOptIn: input.whatsappOptIn ?? true,

      availabilityStatus: "ACTIVE",
      leaveFrom: null,
      leaveTo: null,
      leaveReason: "",
    });

    return user.toObject();
  },

  async updateContactInfo(id: string, input: { phone?: string; whatsappOptIn?: boolean }) {
    await connectDB();

    const update: Record<string, unknown> = {};
    if (input.phone !== undefined) update.phone = input.phone || undefined;
    if (input.whatsappOptIn !== undefined) update.whatsappOptIn = input.whatsappOptIn;

    return User.findByIdAndUpdate(id, update, { new: true }).lean();
  },

  async setActive(id: string, isActive: boolean) {
    await connectDB();

    return User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).lean();
  },

  async updateAvailability(input: {
    userId: string;
    availabilityStatus:
    | "ACTIVE"
    | "ON_LEAVE"
    | "WFH"
    | "HALF_DAY"
    | "INACTIVE";
    leaveFrom?: string;
    leaveTo?: string;
    leaveReason?: string;
    updatedBy?: string;
  }) {
    await connectDB();

    const update: Record<string, unknown> = {
      availabilityStatus: input.availabilityStatus,
    };

    if (input.availabilityStatus === "ON_LEAVE") {
      update.leaveFrom = input.leaveFrom
        ? new Date(input.leaveFrom)
        : null;

      update.leaveTo = input.leaveTo
        ? new Date(input.leaveTo)
        : null;

      update.leaveReason = input.leaveReason ?? "";
    } else {
      update.leaveFrom = null;
      update.leaveTo = null;
      update.leaveReason = "";
    }

    return User.findByIdAndUpdate(
      input.userId,
      update,
      {
        new: true,
        runValidators: true,
      }
    ).lean();
  },
  async update(
    id: string,
    input: {
      firstName?: string;
      lastName?: string;
      name?: string;
      email?: string;
      department?: string;
      designation?: string;
      joiningDate?: string;
      phone?: string;
      whatsappOptIn?: boolean;
      role?: UserRole;
      isActive?: boolean;
    }
  ) {
    await connectDB();
    const update: Record<string, unknown> = {};

    if (input.firstName !== undefined) update.firstName = input.firstName.trim();
    if (input.lastName !== undefined) update.lastName = input.lastName.trim();

    if (input.firstName !== undefined || input.lastName !== undefined) {
      const user = await User.findById(id).lean();
      const fn = input.firstName !== undefined ? input.firstName.trim() : (user as any)?.firstName ?? "";
      const ln = input.lastName !== undefined ? input.lastName.trim() : (user as any)?.lastName ?? "";
      update.name = [fn, ln].filter(Boolean).join(" ") || input.name || (user as any)?.name || "Employee";
    } else if (input.name !== undefined) {
      update.name = input.name.trim();
    }

    if (input.email !== undefined) {
      const existing = await User.findOne({ email: input.email.toLowerCase(), _id: { $ne: id } });
      if (existing) throw new Error("A user with this email already exists");
      update.email = input.email.toLowerCase().trim();
    }

    if (input.department !== undefined) update.department = input.department.trim();
    if (input.designation !== undefined) update.designation = input.designation.trim();
    if (input.joiningDate !== undefined) {
      update.joiningDate = input.joiningDate ? new Date(input.joiningDate) : undefined;
    }
    if (input.phone !== undefined) update.phone = input.phone || undefined;
    if (input.whatsappOptIn !== undefined) update.whatsappOptIn = input.whatsappOptIn;
    if (input.role !== undefined) update.role = input.role;
    if (input.isActive !== undefined) update.isActive = input.isActive;

    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  },

  async delete(id: string) {
    await connectDB();

    return User.findByIdAndDelete(id).lean();
  },

  /**
   * All active Admin + Super Admin users — used to fan out approval-request
   * notifications (task updates, leave requests) and to populate the Super
   * Admin's "choose a leave approver" dropdown.
   */
  async listAdmins() {
    await connectDB();
    return User.find({ role: { $in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true }, "name email role department")
      .sort({ name: 1 })
      .lean();
  },
};