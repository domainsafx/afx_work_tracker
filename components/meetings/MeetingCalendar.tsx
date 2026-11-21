"use client";

import { useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { IMeeting } from "@/types";

type ViewMode = "month" | "week";

function colorFor(meeting: IMeeting): { dot: string; bg: string } {
  if (meeting.status === "CANCELLED") return { dot: "bg-muted-foreground", bg: "bg-secondary text-muted-foreground line-through" };
  if (meeting.status === "COMPLETED") return { dot: "bg-success", bg: "bg-success/10 text-success" };
  if (meeting.status === "ONGOING") return { dot: "bg-destructive", bg: "bg-destructive/10 text-destructive" };
  return { dot: "bg-primary", bg: "bg-primary/10 text-primary" };
}

export function MeetingCalendar({
  meetings,
  loading,
  onSelect,
}: {
  meetings: IMeeting[];
  loading?: boolean;
  onSelect: (meeting: IMeeting) => void;
}) {
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

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, IMeeting[]>();
    for (const meeting of meetings) {
      const key = new Date(meeting.scheduledAt).toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(meeting);
    }
    return map;
  }, [meetings]);

  const sortedMeetings = useMemo(() => {
    return meetings
      .filter((m) => {
        const d = new Date(m.scheduledAt);
        return isSameMonth(d, anchor);
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [meetings, anchor]);

  function navigate(direction: -1 | 1) {
    setAnchor((prev) =>
      view === "month"
        ? direction === 1
          ? addMonths(prev, 1)
          : subMonths(prev, 1)
        : direction === 1
          ? addWeeks(prev, 1)
          : subWeeks(prev, 1)
    );
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
          <span className="min-w-32 sm:min-w-40 text-center text-sm font-semibold">
            {view === "month" ? format(anchor, "MMMM yyyy") : `Week of ${format(startOfWeek(anchor), "MMM d")}`}
          </span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
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
            <Button size="sm" className="h-8 text-xs" variant={view === "month" ? "default" : "ghost"} onClick={() => setView("month")}>
              Month
            </Button>
            <Button size="sm" className="h-8 text-xs" variant={view === "week" ? "default" : "ghost"} onClick={() => setView("week")}>
              Week
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Agenda List View */}
      <div className={cn("space-y-2 md:hidden", mobileMode !== "agenda" && "hidden")}>
        {sortedMeetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No meetings scheduled for {format(anchor, "MMMM yyyy")}.
          </div>
        ) : (
          sortedMeetings.map((meeting) => {
            const c = colorFor(meeting);
            return (
              <div
                key={meeting._id}
                onClick={() => onSelect(meeting)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-sm active:bg-secondary/40 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      {format(new Date(meeting.scheduledAt), "EEE, MMM d · HH:mm")}
                    </span>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", c.bg)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                      {meeting.status}
                    </span>
                  </div>
                  <div className="mt-1 font-medium text-sm truncate">{meeting.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2">
                    <span>{meeting.durationMinutes} min</span>
                    <span>· {meeting.meetingType === "IN_APP" ? "In-app call" : "External"}</span>
                  </div>
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
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div
            className={cn(
              "grid grid-cols-7 gap-1 sm:gap-1.5",
              view === "month" ? "auto-rows-[4.5rem] sm:auto-rows-[6rem] md:auto-rows-[7rem]" : "auto-rows-[10rem]"
            )}
          >
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayMeetings = meetingsByDay.get(key) ?? [];
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
                    {dayMeetings.map((meeting) => {
                      const c = colorFor(meeting);
                      return (
                        <button
                          key={meeting._id}
                          onClick={() => onSelect(meeting)}
                          title={meeting.title}
                          className={cn(
                            "flex w-full items-center gap-1 rounded-lg p-1 text-left font-medium leading-tight hover:opacity-80",
                            c.bg
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
                          <span className="truncate text-[10px] sm:text-[11px]">{meeting.title}</span>
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
