"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, isOverdue } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "month" | "week";

function colorFor(task: any): { dot: string; bg: string; label: string } {
  if (task.status === "COMPLETED") return { dot: "bg-success", bg: "bg-success/10 text-success", label: "Completed" };
  if (isOverdue(task.deadline)) return { dot: "bg-destructive", bg: "bg-destructive/10 text-destructive", label: "Overdue" };
  if (task.status === "IN_PROGRESS" || task.status === "NOTICED")
    return { dot: "bg-warning", bg: "bg-warning/10 text-warning", label: "Working" };
  return { dot: "bg-primary", bg: "bg-primary/10 text-primary", label: "Upcoming" };
}

export function TaskCalendar({ tasks, loading }: { tasks: any[]; loading?: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("month");
  const [anchor, setAnchor] = useState(new Date());
  const [mobileMode, setMobileMode] = useState<"agenda" | "grid">("agenda");

  const days = useMemo(() => {
    if (view === "month") {
      const start = startOfWeek(startOfMonth(anchor));
      const end = endOfWeek(endOfMonth(anchor));
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(anchor);
    const end = endOfWeek(anchor);
    return eachDayOfInterval({ start, end });
  }, [anchor, view]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const key = new Date(task.deadline).toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        return isSameMonth(d, anchor);
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks, anchor]);

  function navigate(direction: -1 | 1) {
    setAnchor((prev) => (view === "month" ? (direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1)) : direction === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1)));
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
        {Array.from({ length: 14 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 sm:min-w-40 text-center text-sm font-semibold">{format(anchor, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setAnchor(new Date())}>Today</Button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Agenda vs Grid Toggle */}
          <div className="flex md:hidden rounded-lg border border-border bg-secondary/30 p-0.5 text-xs">
            <button
              onClick={() => setMobileMode("agenda")}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                mobileMode === "agenda" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Agenda
            </button>
            <button
              onClick={() => setMobileMode("grid")}
              className={cn(
                "rounded px-2.5 py-1 font-medium transition-colors",
                mobileMode === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              Month Grid
            </button>
          </div>

          <div className="hidden md:flex gap-1 rounded-xl border border-border p-0.5 sm:p-1">
            <Button size="sm" className="h-8 text-xs" variant={view === "month" ? "default" : "ghost"} onClick={() => setView("month")}>Month</Button>
            <Button size="sm" className="h-8 text-xs" variant={view === "week" ? "default" : "ghost"} onClick={() => setView("week")}>Week</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5 sm:gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Completed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> Working</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Overdue</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Upcoming</span>
      </div>

      {/* Mobile Agenda List View */}
      <div className={cn("space-y-2 md:hidden", mobileMode !== "agenda" && "hidden")}>
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No tasks due in {format(anchor, "MMMM yyyy")}.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const c = colorFor(task);
            return (
              <div
                key={task._id}
                onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-sm active:bg-secondary/40 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      {format(new Date(task.deadline), "EEE, MMM d")}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", c.bg)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                      {c.label}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-sm truncate">{task.title}</div>
                  {task.assignedTo?.name && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Assigned to {task.assignedTo.name}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            );
          })
        )}
      </div>

      {/* Grid View (w-full, no horizontal scroll) */}
      <div className={cn("w-full", mobileMode !== "grid" && "hidden md:block")}>
        <div className="w-full space-y-1.5">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className={cn("grid grid-cols-7 gap-1 sm:gap-1.5", view === "month" ? "auto-rows-[4.5rem] sm:auto-rows-[6rem] md:auto-rows-[7rem]" : "auto-rows-[10rem]")}>
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(key) ?? [];
              const inMonth = view === "week" || isSameMonth(day, anchor);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-1 overflow-hidden rounded-xl border border-border p-1 text-left",
                    !inMonth && "opacity-40",
                    isToday && "border-primary/60 bg-primary/5"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday && "text-primary")}>{format(day, "d")}</span>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayTasks.map((task) => {
                      const c = colorFor(task);
                      return (
                        <button
                          key={task._id}
                          onClick={() => router.push(`/dashboard/tasks/${task._id}`)}
                          title={task.title}
                          className={cn("flex w-full items-center gap-1 rounded-lg p-1 text-left font-medium leading-tight hover:opacity-80", c.bg)}
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                          <span className="truncate text-[10px] sm:text-[11px]">{task.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
