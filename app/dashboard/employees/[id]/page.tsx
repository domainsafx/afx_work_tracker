"use client";

import { use, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  useEmployee,
} from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { BackButton } from "@/components/common/BackButton";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditEmployeeModal } from "@/components/modals/EditEmployeeModal";
import { AvailabilityForm } from "@/components/forms/AvailabilityForm";
import { TaskForm } from "@/components/forms/TaskForm";
import WorkLogCalendar from "@/components/dashboard/WorkLogCalendar";
import { formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Plus,
  Shield,
  MessageCircle,
} from "lucide-react";

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session } = useSession();
  const viewerRole = (session?.user as any)?.role;
  const isSuperAdmin = viewerRole === "SUPER_ADMIN";
  const isAdmin = viewerRole === "ADMIN";
  const canEdit = isSuperAdmin || isAdmin;

  const { data: employee, isLoading } = useEmployee(id);
  const { data: tasksData, isLoading: tasksLoading } = useTasks({
    assignedTo: id,
    limit: "50",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <BackButton fallbackHref="/dashboard/employees" label="Back to Employees" />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Employee not found.</p>
        </Card>
      </div>
    );
  }

  const tasks = tasksData?.items ?? [];
  const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t: any) =>
    ["IN_PROGRESS", "NOTICED"].includes(t.status)
  ).length;
  const delayedTasks = tasks.filter((t: any) =>
    ["DELAYED", "ISSUE"].includes(t.status)
  ).length;

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/dashboard/employees" label="Back to Employees" />

      {/* Profile Header */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {employee.name
                ? employee.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "EM"}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{employee.name}</h1>
                {employee.employeeId && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {employee.employeeId}
                  </Badge>
                )}
                <Badge variant={employee.role === "ADMIN" ? "default" : "secondary"}>
                  {employee.role}
                </Badge>
                <Badge variant={employee.isActive ? "success" : "destructive"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                {employee.designation || "No designation"} · {employee.department || "No department"}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Details
              </Button>

              <Button size="sm" variant="outline" onClick={() => setAvailabilityOpen(true)}>
                <Shield className="mr-1.5 h-3.5 w-3.5" /> Availability
              </Button>

              <Button size="sm" onClick={() => setAssignOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Assign Task
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
              <p className="text-xl font-bold">{tasks.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-xl font-bold">{inProgressTasks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl font-bold">{completedTasks}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delayed / Issues</p>
              <p className="text-xl font-bold">{delayedTasks}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" /> First Name
              </span>
              <span className="font-medium">{employee.firstName || employee.name?.split(" ")[0] || "—"}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" /> Last Name
              </span>
              <span className="font-medium">
                {employee.lastName || employee.name?.split(" ").slice(1).join(" ") || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" /> Company Email
              </span>
              <span className="font-medium">{employee.email}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" /> WhatsApp Phone
              </span>
              <span className="font-medium flex items-center gap-1.5">
                {employee.phone ? (
                  <>
                    <MessageCircle className="h-3.5 w-3.5 text-success" />
                    {employee.phone}
                  </>
                ) : (
                  "Not provided"
                )}
              </span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4" /> Department
              </span>
              <span className="font-medium">{employee.department || "—"}</span>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" /> Designation
              </span>
              <span className="font-medium">{employee.designation || "—"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" /> Joining Date
              </span>
              <span className="font-medium">
                {employee.joiningDate ? formatDate(employee.joiningDate) : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Availability & Status Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Availability &amp; Leave Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Current Availability</span>
              <Badge
                variant={
                  employee.availabilityStatus === "ACTIVE"
                    ? "success"
                    : employee.availabilityStatus === "ON_LEAVE"
                      ? "destructive"
                      : "secondary"
                }
              >
                {employee.availabilityStatus || "ACTIVE"}
              </Badge>
            </div>

            {employee.availabilityStatus === "ON_LEAVE" && (
              <>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground">Leave Window</span>
                  <span className="font-medium">
                    {employee.leaveFrom ? formatDate(employee.leaveFrom) : "—"} to{" "}
                    {employee.leaveTo ? formatDate(employee.leaveTo) : "—"}
                  </span>
                </div>

                <div className="border-b pb-2">
                  <p className="text-muted-foreground">Leave Reason</p>
                  <p className="mt-1 font-medium">{employee.leaveReason || "No reason specified"}</p>
                </div>
              </>
            )}

            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">WhatsApp Notifications</span>
              <Badge variant={employee.whatsappOptIn ? "success" : "secondary"}>
                {employee.whatsappOptIn ? "Opted In" : "Opted Out"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account Created</span>
              <span className="font-medium">{formatDate(employee.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Assigned Tasks ({tasks.length})</CardTitle>
            <CardDescription>All tasks assigned to {employee.name}.</CardDescription>
          </div>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Assign Task
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No tasks currently assigned to this employee.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <div
                  key={task._id}
                  className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/dashboard/tasks/${task._id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {task.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{task.department}</span>
                      <span>·</span>
                      <span>Deadline: {formatDate(task.deadline)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-24">
                      <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                        <span>Progress</span>
                        <span>{task.completionPercent}%</span>
                      </div>
                      <Progress value={task.completionPercent} className="h-1.5" />
                    </div>

                    <Badge
                      variant={
                        task.status === "COMPLETED"
                          ? "success"
                          : ["DELAYED", "ISSUE"].includes(task.status)
                            ? "destructive"
                            : "default"
                      }
                    >
                      {task.status.replace("_", " ")}
                    </Badge>

                    <Link href={`/dashboard/tasks/${task._id}`}>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Work Logs Calendar */}
      <WorkLogCalendar employeeId={id} employeeName={employee.name} readOnly={!isSuperAdmin} />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        user={employee}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Availability Dialog */}
      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Availability — {employee.name}</DialogTitle>
            <DialogDescription>
              Update leave status and active availability for this team member.
            </DialogDescription>
          </DialogHeader>
          <AvailabilityForm
            employee={employee}
            onDone={() => setAvailabilityOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Task Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Task to {employee.name}</DialogTitle>
            <DialogDescription>
              Assign a new task directly to this team member.
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
    </div>
  );
}
