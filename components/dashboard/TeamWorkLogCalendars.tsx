"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Building,
  Calendar,
  MessageCircle,
} from "lucide-react";

import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import WorkLogCalendar from "@/components/dashboard/WorkLogCalendar";
import { formatDate } from "@/lib/utils";

/**
 * Super Admin & Admin panel: pick a team member and view their entire details,
 * performance stats, assigned tasks, and monthly work log history.
 */
export default function TeamWorkLogCalendars() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const roleFilter = role === "SUPER_ADMIN" ? "ADMIN,EMPLOYEE" : "EMPLOYEE";

  const { data, isLoading } = useEmployees({ role: roleFilter, limit: "200" });
  const [selectedId, setSelectedId] = useState<string>("");

  const members = data?.items ?? [];
  const selected = members.find((m: any) => m._id === selectedId);

  const { data: tasksData, isLoading: tasksLoading } = useTasks(
    selectedId ? { assignedTo: selectedId, limit: "20" } : {}
  );

  const tasks = selectedId ? (tasksData?.items ?? []) : [];
  const inProgressTasks = tasks.filter((t: any) =>
    ["IN_PROGRESS", "NOTICED"].includes(t.status)
  ).length;
  const completedTasks = tasks.filter((t: any) => t.status === "COMPLETED").length;
  const delayedTasks = tasks.filter((t: any) =>
    ["DELAYED", "ISSUE"].includes(t.status)
  ).length;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Selector Card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Team Work Logs &amp; Activity</h3>
              <p className="text-sm text-muted-foreground">
                Select an employee to view their full profile, assigned tasks, stats, and daily work logs.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-72">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Loading team..." : "Select a team member"}
                />
              </SelectTrigger>
              <SelectContent>
                {members.map((m: any) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name} {m.role === "ADMIN" ? "(Admin)" : ""} — {m.department || "General"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {selected && (
        <div className="space-y-6">
          {/* Employee Overview Header */}
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
                  {selected.name
                    ? selected.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "EM"}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    {selected.employeeId && (
                      <Badge variant="outline" className="font-mono text-xs">
                        {selected.employeeId}
                      </Badge>
                    )}
                    <Badge variant={selected.role === "ADMIN" ? "default" : "secondary"}>
                      {selected.role}
                    </Badge>
                    <Badge
                      variant={
                        selected.availabilityStatus === "ACTIVE"
                          ? "success"
                          : selected.availabilityStatus === "ON_LEAVE"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {selected.availabilityStatus || "ACTIVE"}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {selected.designation || "No designation"} · {selected.department || "No department"}
                  </p>
                </div>
              </div>

              <Link href={`/dashboard/employees/${selected._id}`}>
                <Button size="sm" variant="outline">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Full Employee Page &amp; Edit
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="grid gap-3 border-t pt-4 text-xs sm:grid-cols-2 md:grid-cols-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="truncate font-medium text-foreground">{selected.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <span className="truncate font-medium text-foreground">
                  {selected.phone || "No phone added"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-3.5 w-3.5 text-primary" />
                <span className="truncate font-medium text-foreground">
                  {selected.department || "No department"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="truncate font-medium text-foreground">
                  Joined: {selected.joiningDate ? formatDate(selected.joiningDate) : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
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

          {/* Assigned Tasks & Current Work */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Assigned Tasks ({tasks.length})</CardTitle>
                <CardDescription>Current and past tasks assigned to {selected.name}.</CardDescription>
              </div>
              <Link href={`/dashboard/employees/${selected._id}`}>
                <Button size="sm" variant="ghost" className="text-xs text-primary">
                  View all in profile →
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No tasks currently assigned to this team member.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.slice(0, 5).map((task: any) => (
                    <div
                      key={task._id}
                      className="flex flex-col gap-2 rounded-xl border p-3 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-0.5">
                        <Link
                          href={`/dashboard/tasks/${task._id}`}
                          className="font-medium text-foreground hover:text-primary hover:underline text-sm"
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
                        <div className="w-20">
                          <div className="mb-0.5 flex justify-between text-[10px] text-muted-foreground">
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
                          className="text-xs"
                        >
                          {task.status.replace("_", " ")}
                        </Badge>

                        <Link href={`/dashboard/tasks/${task._id}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            View Task
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Work Log Calendar */}
          <WorkLogCalendar
            employeeId={selected._id}
            employeeName={selected.name}
            readOnly
          />
        </div>
      )}
    </div>
  );
}
