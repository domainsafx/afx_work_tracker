import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { taskService } from "@/services/taskService";
import { updateTaskStageSchema } from "@/lib/validations";

// PATCH /api/tasks/:id/stage — move a task through the checklist workflow
// (Checklist -> WIP -> Waiting for Approval -> Changes to be Made -> Sent to
// Client -> Finalized -> Closed). The assignee can move their own task;
// Admin/Super Admin can move any task.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTaskStageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const role = (session.user as any).role;
  if (role === "EMPLOYEE") {
    const task = await taskService.findById(id);
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const assignedId = (task as any).assignedTo?._id?.toString();
    if (assignedId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await taskService.updateStage(
    id,
    parsed.data.stage,
    { id: session.user.id as string, name: session.user.name ?? "User" },
    { link: parsed.data.link, links: parsed.data.links, note: parsed.data.note }
  );
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
