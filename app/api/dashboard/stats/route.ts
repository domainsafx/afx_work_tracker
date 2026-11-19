import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");

  if (employeeId && (role === "SUPER_ADMIN" || role === "ADMIN")) {
    const stats = await taskService.statsForEmployee(employeeId);
    return NextResponse.json(stats);
  }

  if (role === "EMPLOYEE") {
    const stats = await taskService.statsForEmployee(session.user.id as string);
    return NextResponse.json(stats);
  }

  const stats = await taskService.statsForAdmin();
  return NextResponse.json(stats);
}
