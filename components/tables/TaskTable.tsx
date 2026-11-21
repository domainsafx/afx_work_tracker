"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EditTaskModal } from "../modals/EditTaskModal";
import { TransferTaskModal } from "@/components/modals/TransferTaskModal";
import { TaskStageBadge } from "@/components/tasks/TaskStageControl";
import { formatDate, isOverdue } from "@/lib/utils";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "secondary",
  NOTICED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  ISSUE: "destructive",
  DELAYED: "destructive",
  CANCELLED: "secondary",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "PENDING",
  NOTICED: "NOTICED",
  IN_PROGRESS: "WORKING ON IT",
  COMPLETED: "COMPLETED",
  ISSUE: "ISSUE",
  DELAYED: "DELAYED",
  CANCELLED: "CANCELLED",
};

const PRIORITY_TONE: Record<string, "default" | "success" | "warning" | "destructive"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
};

export function TaskTable({
  tasks,
  loading,
  showEmployee = false,
  compact = false,
  statusMode = "progress",
}: {
  tasks: any[];
  loading?: boolean;
  showEmployee?: boolean;
  compact?: boolean;
  /** "checklist" shows the delivery-checklist stage in the Status column instead of the progress status. */
  statusMode?: "progress" | "checklist";
}) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = session?.user?.id;

  const router = useRouter();

  const deleteTask = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete task");
      }

      alert("Task deleted successfully");

      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No tasks to show yet.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {tasks.map((task) => {
          const assignedId = task.assignedTo?._id ?? task.assignedTo;
          const isAssignee = assignedId === userId;
          const canUpdate =
            ((role === "EMPLOYEE" && isAssignee) ||
              role === "ADMIN" ||
              role === "SUPER_ADMIN") &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED";
          const canTransfer =
            role === "EMPLOYEE" &&
            isAssignee &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED";
          const isClosed = task.status === "COMPLETED" || task.status === "CANCELLED";

          return (
            <div key={task._id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/tasks/${task._id}`}
                    className="font-semibold text-foreground hover:text-primary hover:underline text-sm block"
                  >
                    {task.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.department}
                    {showEmployee && task.assignedTo?.name && ` · ${task.assignedTo.name}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={PRIORITY_TONE[task.priority]} className="text-[10px] px-1.5 py-0">
                    {task.priority}
                  </Badge>
                  {statusMode === "checklist" ? (
                    <TaskStageBadge stage={task.stage ?? "CHECKLIST"} />
                  ) : (
                    <Badge variant={STATUS_TONE[task.status]} className="text-[10px] px-1.5 py-0">
                      {STATUS_LABEL[task.status] ?? task.status.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress and Deadline */}
              <div className="space-y-1.5 border-y border-border/60 py-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-foreground">{task.completionPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all rounded-full"
                    style={{ width: `${task.completionPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className={isOverdue(task.deadline) && task.status !== "COMPLETED" ? "text-destructive font-medium" : "text-foreground"}>
                    {formatDate(task.deadline)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {canUpdate && !isClosed && (
                  <Link href={`/dashboard/tasks/${task._id}`} className="flex-1 min-w-[120px]">
                    <Button size="sm" variant="outline" className="w-full text-xs h-9">
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Update Task
                    </Button>
                  </Link>
                )}

                {canTransfer && !isClosed && (
                  <TransferTaskModal
                    taskId={task._id}
                    taskTitle={task.title}
                    excludeUserId={userId}
                  />
                )}

                {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                  <div className="flex items-center gap-1.5">
                    <EditTaskModal
                      task={task}
                      trigger={
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9"
                          aria-label="Edit task"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />

                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-9 w-9"
                      aria-label="Delete task"
                      onClick={() => deleteTask(task._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>{statusMode === "checklist" ? "Checklist" : "Status"}</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Deadline</TableHead>
          {<TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const assignedId = task.assignedTo?._id ?? task.assignedTo;

          const isAssignee = assignedId === userId;

          // Only employees can update their own assigned tasks.
          // Admins and Super Admins have view-only access.
          const canUpdate =
            (
              (role === "EMPLOYEE" && isAssignee) ||
              (role === "ADMIN") ||
              (role === "SUPER_ADMIN")
            ) &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED";
          // Employees can request transfer of their own active tasks.
          const canTransfer =
            role === "EMPLOYEE" &&
            isAssignee &&
            task.status !== "COMPLETED" &&
            task.status !== "CANCELLED";
          const isClosed = task.status === "COMPLETED" || task.status === "CANCELLED";

          return (
            <TableRow key={task._id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/tasks/${task._id}`} className="hover:text-primary hover:underline">
                  {task.title}
                </Link>
                {!compact && <div className="text-xs text-muted-foreground">{task.department}</div>}
              </TableCell>
              {showEmployee && (
                <TableCell>
                  <div className="font-medium">
                    {task.assignedTo?.name ?? "Unassigned"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {task.assignedTo?.designation ?? task.assignedTo?.email ?? ""}
                  </div>
                </TableCell>
              )}
              <TableCell>
                <Badge variant={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
              </TableCell>
              <TableCell>
                {statusMode === "checklist" ? (
                  <TaskStageBadge stage={task.stage ?? "CHECKLIST"} />
                ) : (
                  <Badge variant={STATUS_TONE[task.status]}>{STATUS_LABEL[task.status] ?? task.status.replace("_", " ")}</Badge>
                )}
              </TableCell>
              <TableCell className="w-32">{task.completionPercent}%</TableCell>
              <TableCell className={isOverdue(task.deadline) && task.status !== "COMPLETED" ? "text-destructive" : ""}>
                {formatDate(task.deadline)}
              </TableCell>
              {(
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">

                    {canUpdate && !isClosed && (
                      <Link href={`/dashboard/tasks/${task._id}`}>
                        <Button size="sm" variant="outline">
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Update Task
                        </Button>
                      </Link>
                    )}

                    {canTransfer && !isClosed && (
                      <TransferTaskModal
                        taskId={task._id}
                        taskTitle={task.title}
                        excludeUserId={userId}
                      />
                    )}

                    {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                      <div className="flex items-center justify-end gap-2">
                        <EditTaskModal
                          task={task}
                          trigger={
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />

                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => deleteTask(task._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                  </div>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
        </Table>
      </div>
    </>
  );
}
