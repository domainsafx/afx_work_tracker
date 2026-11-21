"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PartyPopper, Trash2 } from "lucide-react";
import type { IHoliday } from "@/types";

export function HolidayCalendar({
  holidays,
  loading,
  canManage,
  onDelete,
  anchor,
  onAnchorChange,
}: {
  holidays: IHoliday[];
  loading?: boolean;
  canManage?: boolean;
  onDelete?: (id: string) => void;
  anchor: Date;
  onAnchorChange: (date: Date) => void;
}) {
  const [mobileMode, setMobileMode] = useState<"agenda" | "grid">("agenda");

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchor));
    const end = endOfWeek(endOfMonth(anchor));
    return eachDayOfInterval({ start, end });
  }, [anchor]);

  const holidaysByDay = useMemo(() => {
    const map = new Map<string, IHoliday[]>();
    for (const holiday of holidays) {
      const key = new Date(holiday.date).toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(holiday);
    }
    return map;
  }, [holidays]);

  const monthHolidays = useMemo(() => {
    return holidays
      .filter((h) => isSameMonth(new Date(h.date), anchor))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, anchor]);

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
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onAnchorChange(subMonths(anchor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-32 sm:min-w-40 text-center text-sm font-semibold">{format(anchor, "MMMM yyyy")}</span>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onAnchorChange(addMonths(anchor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => onAnchorChange(new Date())}>
            Today
          </Button>
        </div>

        {/* Mobile View Toggle */}
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
      </div>

      {/* Mobile Agenda List View */}
      <div className={cn("space-y-2 md:hidden", mobileMode !== "agenda" && "hidden")}>
        {monthHolidays.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No holidays in {format(anchor, "MMMM yyyy")}.
          </div>
        ) : (
          monthHolidays.map((holiday) => (
            <div
              key={holiday._id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 text-card-foreground shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">
                    {format(new Date(holiday.date), "EEE, MMM d")}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                    {holiday.type}
                  </span>
                </div>
                <div className="mt-1 font-medium text-sm truncate">{holiday.title}</div>
                {holiday.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground truncate">{holiday.description}</div>
                )}
              </div>
              {canManage && onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                  onClick={() => onDelete(holiday._id)}
                  title="Remove holiday"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Month Grid View (w-full, no horizontal scrolling) */}
      <div className={cn("w-full", mobileMode !== "grid" && "hidden md:block")}>
        <div className="w-full space-y-1.5">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 auto-rows-[4.5rem] sm:auto-rows-[6rem] md:auto-rows-[7rem]">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayHolidays = holidaysByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, anchor);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col gap-1 overflow-hidden rounded-xl border border-border p-1 text-left",
                    !inMonth && "opacity-40",
                    isToday && "border-primary/60 bg-primary/5",
                    dayHolidays.length > 0 && "border-success/40 bg-success/5"
                  )}
                >
                  <span className={cn("text-xs font-medium", isToday && "text-primary")}>{format(day, "d")}</span>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayHolidays.map((holiday) => (
                      <div
                        key={holiday._id}
                        title={holiday.description || holiday.title}
                        className="group flex items-center gap-1 rounded-lg bg-success/10 p-1 text-left font-medium leading-tight text-success"
                      >
                        <PartyPopper className="h-2.5 w-2.5 shrink-0 hidden sm:inline" />
                        <span className="flex-1 truncate text-[10px] sm:text-[11px]">{holiday.title}</span>
                        {canManage && onDelete && (
                          <button
                            onClick={() => onDelete(holiday._id)}
                            className="hidden shrink-0 hover:text-destructive group-hover:block"
                            title="Remove holiday"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
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
