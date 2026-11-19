import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userService } from "@/services/userService";
import { updateEmployeeSchema } from "@/lib/validations";
import { can, isAdminLike } from "@/utils/permissions";

// GET /api/users/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as any).role;

  // Employees may only fetch their own profile
  if (role === "EMPLOYEE" && session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await userService.findById(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...user, passwordHash: undefined });
}

// PATCH /api/users/:id - update employee details, contact info, or account status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const body = await req.json();
  const { id } = await params;

  if (!isAdminLike(role)) {
    return NextResponse.json({ error: "Only Admin or Super Admin can edit employees" }, { status: 403 });
  }

  const target = await userService.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin cannot edit other Admins or Super Admin
  if (role === "ADMIN" && (target.role === "ADMIN" || target.role === "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Admins cannot edit fellow Admins or Super Admin" }, { status: 403 });
  }

  // Only Super Admin can change role
  if (body.role !== undefined && body.role !== target.role && !can(role, "CHANGE_ROLE")) {
    return NextResponse.json({ error: "Only Super Admin can change user roles" }, { status: 403 });
  }

  // Only Super Admin can change isActive status
  if (
    body.isActive !== undefined &&
    body.isActive !== target.isActive &&
    !can(role, body.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER")
  ) {
    return NextResponse.json({ error: "Only Super Admin can change account active status" }, { status: 403 });
  }

  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const updated = await userService.update(id, parsed.data);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...updated, passwordHash: undefined });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to update employee" }, { status: 400 });
  }
}

// DELETE /api/users/:id - Super Admin only
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { id } = await params;
  const target = await userService.findById(id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const permission = target.role === "ADMIN" ? "DELETE_ADMIN" : "DELETE_EMPLOYEE";
  if (!can(role, permission as any)) {
    return NextResponse.json({ error: "Only Super Admin can delete users" }, { status: 403 });
  }

  await userService.delete(id);
  return NextResponse.json({ success: true });
}
