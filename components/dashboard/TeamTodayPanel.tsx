"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarCheck2, Clock, Flag, Search, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks, useUpdateTaskStage } from "@/hooks/useTasks";
import { TaskStageSelect } from "@/components/tasks/TaskStageControl";
import { TaskForm } from "@/components/forms/TaskForm";
import { can } from "@/utils/permissions";
import { cn, formatDate } from "@/lib/utils";
import type { TaskStage } from "@/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const PRIORITY_VARIANT: Record<string, "default" | "warning" | "destructive"> = {
  LOW: "default",
  MEDIUM: "warning",
  HIGH: "destructive",
};

function EmployeeTaskItem({ task }: { task: any }) {
  const updateStage = useUpdateTaskStage(task._id);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Flag className="h-3 w-3" />
            <Badge variant={PRIORITY_VARIANT[task.priority] ?? "default"} className="px-1.5 py-0">
              {task.priority}
            </Badge>
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Due {formatDate(task.deadline)}
          </span>
        </div>
      </div>
      <TaskStageSelect
        stage={task.stage as TaskStage}
        disabled={updateStage.isPending}
        onChange={(stage) => updateStage.mutate(stage)}
      />
    </div>
  );
}

function EmployeeTasksDialog({
  employee,
  canAssign,
  onClose,
}: {
  employee: any;
  canAssign: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useTasks({
    assignedTo: employee._id,
    today: "true",
    limit: "50",
  });
  const tasks = data?.items ?? [];
  const [assignOpen, setAssignOpen] = useState(false);

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback>{initials(employee.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 text-left">
                  <DialogTitle className="truncate text-base sm:text-lg">{employee.name}</DialogTitle>
                  <DialogDescription className="truncate text-xs sm:text-sm">
                    {employee.designation || employee.department || "Team member"} · Today&apos;s tasks
                  </DialogDescription>
                </div>
              </div>

              {canAssign && (
                <Button
                  size="sm"
                  className="w-full sm:w-auto shrink-0"
                  onClick={() => setAssignOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Assign task
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2.5 overflow-y-auto pr-1">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}

            {!isLoading && tasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No tasks scheduled for {employee.name.split(" ")[0]} today.
              </div>
            )}

            {!isLoading && tasks.map((task) => <EmployeeTaskItem key={task._id} task={task} />)}
          </div>
        </DialogContent>
      </Dialog>

      {canAssign && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Assign task to {employee.name}</DialogTitle>
              <DialogDescription>
                The task will be assigned directly to {employee.name.split(" ")[0]} and they&apos;ll be
                notified immediately.
              </DialogDescription>
            </DialogHeader>
            <TaskForm
              onDone={() => setAssignOpen(false)}
              initialValues={{
                assignedTo: employee._id,
                department: employee.department ?? "",
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/**
 * Admin-only widget: shows everyone who is active today, and lets an admin
 * click through to see (and move the checklist stage of) that person's
 * tasks for today.
 */
export function TeamTodayPanel() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useEmployees({
    availabilityStatus: "ACTIVE",
    role: "EMPLOYEE,ADMIN",
    isActive: "true",
  });

  const employees = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (e: any) =>
        e.name?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
    );
  }, [data, search]);

  const canAssign = can(role, "ASSIGN_TASK");

  if (!can(role, "VIEW_ALL_EMPLOYEES")) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Active today</h2>
            <Badge variant="success">{employees.length}</Badge>
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 sm:h-8 pl-8 text-xs"
              placeholder="Search team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && employees.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No one is marked active today.
          </div>
        )}

        {!isLoading && employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {employees.map((employee: any) => (
              <button
                key={employee._id}
                onClick={() => setSelected(employee)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl border border-border bg-background/60 p-3 text-left transition-colors",
                  "hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <span className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(employee.name)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{employee.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {employee.designation || employee.department || "—"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      {selected && (
        <EmployeeTasksDialog
          employee={selected}
          canAssign={canAssign}
          onClose={() => setSelected(null)}
        />
      )}
    </Card>
  );
}
