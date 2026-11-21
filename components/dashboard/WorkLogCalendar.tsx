"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lock, CalendarOff, CalendarDays, ListFilter } from "lucide-react";

import {
  useMonthlyWorkLogs,
  type CalendarDay,
} from "@/hooks/useWorkLogs";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import WorkLogForm from "@/components/forms/WorkLogForm";

const WEEKDAYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface WorkLogCalendarProps {
  /** Omit to show the signed-in user's own calendar. */
  employeeId?: string;

  employeeName?: string;

  /** True when viewing someone else's calendar. */
  readOnly?: boolean;
}

export default function WorkLogCalendar({
  employeeId,
  employeeName,
  readOnly = false,
}: WorkLogCalendarProps) {
  const now = new Date();

  const [year, setYear] = useState(
    now.getFullYear()
  );

  const [month, setMonth] = useState(
    now.getMonth() + 1
  );

  const [selectedDay, setSelectedDay] =
    useState<CalendarDay | null>(null);

  const [mobileView, setMobileView] =
    useState<"agenda" | "grid">("agenda");

  const {
    data,
    loading,
    error,
    mutate,
  } = useMonthlyWorkLogs(
    year,
    month,
    employeeId
  );

  const leadingBlanks = useMemo(() => {
    return new Date(
      year,
      month - 1,
      1
    ).getDay();
  }, [year, month]);

  function goToPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function statusLabel(day: CalendarDay) {
    /**
     * APPROVED LEAVE gets priority over
     * an empty work log.
     */
    if (day.leave) {
      return "LEAVE";
    }

    if (day.log) {
      return "Logged";
    }

    if (day.isFuture) {
      return "";
    }

    return "No entry";
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-4 py-3 sm:px-6 sm:py-4 gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">
            {employeeName
              ? `${employeeName}'s Work Log`
              : "My Work Log"}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Mobile View Toggle */}
          <div className="flex sm:hidden rounded-lg border border-border p-0.5 bg-secondary/40">
            <button
              type="button"
              onClick={() => setMobileView("agenda")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mobileView === "agenda"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setMobileView("grid")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                mobileView === "grid"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={goToPrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CALENDAR */}
      <div className="p-3 sm:p-4">
        {loading && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading calendar...
          </div>
        )}

        {error && (
          <div className="py-10 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* Mobile Agenda View (when in agenda mode on mobile) */}
            <div className={`space-y-2 ${mobileView === "agenda" ? "block sm:hidden" : "hidden"}`}>
              {data.days.map((day) => {
                const dayNumber = Number(day.date.slice(-2));
                const dateObj = new Date(year, month - 1, dayNumber);
                const weekday = WEEKDAYS[dateObj.getDay()];
                const isLeave = Boolean(day.leave);
                const clickable =
                  !day.isFuture &&
                  !day.isSunday &&
                  !isLeave &&
                  (readOnly || day.isEditable);

                return (
                  <div
                    key={`agenda-${day.date}`}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-xs transition-colors ${
                      day.isSunday
                        ? "border-red-200 bg-red-50/60 text-red-500"
                        : isLeave
                          ? "border-amber-200 bg-amber-50/60 text-amber-700"
                          : day.isFuture
                            ? "border-dashed bg-muted/20 text-muted-foreground"
                            : day.log
                              ? "border-primary/30 bg-primary/5"
                              : "border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg border bg-background shrink-0 font-semibold text-foreground">
                        <span className="text-[10px] text-muted-foreground leading-none">{weekday}</span>
                        <span className="text-sm leading-none mt-0.5">{dayNumber}</span>
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        {isLeave ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <CalendarOff className="h-3 w-3" /> Approved Leave
                          </span>
                        ) : day.isSunday ? (
                          <span className="font-medium text-red-500">Sunday</span>
                        ) : day.log ? (
                          <div>
                            <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-success/15 text-success">
                              Logged
                            </span>
                            {day.log.summary && (
                              <p className="text-muted-foreground line-clamp-1 truncate mt-0.5 max-w-[180px]">
                                {day.log.summary}
                              </p>
                            )}
                          </div>
                        ) : day.isFuture ? (
                          <span className="text-muted-foreground">Upcoming</span>
                        ) : (
                          <span className="text-muted-foreground">No work entry</span>
                        )}
                      </div>
                    </div>

                    {clickable ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs shrink-0"
                        onClick={() => setSelectedDay(day)}
                      >
                        {day.log ? "Edit" : "Log Work"}
                      </Button>
                    ) : (
                      (isLeave || !day.isEditable || day.isSunday) && (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mr-1" />
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Grid View (Desktop always, Mobile when toggled to Month) */}
            <div className={`w-full ${mobileView === "agenda" ? "hidden sm:block" : "block"}`}>
              <div className="w-full">
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="pb-1 text-center text-xs font-semibold text-muted-foreground"
                    >
                      {wd}
                    </div>
                  ))}

                  {Array.from({
                    length: leadingBlanks,
                  }).map((_, i) => (
                    <div key={`blank-${i}`} />
                  ))}

                  {data.days.map((day) => {
                    const dayNumber = Number(
                      day.date.slice(-2)
                    );

                    /**
                     * Leave days must NEVER open
                     * the Work Log form.
                     */
                    const isLeave = Boolean(day.leave);

                    const clickable =
                      !day.isFuture &&
                      !day.isSunday &&
                      !isLeave &&
                      (readOnly ||
                        day.isEditable);

                    return (
                      <button
                        key={day.date}
                        type="button"
                        disabled={!clickable}
                        onClick={() =>
                          clickable &&
                          setSelectedDay(day)
                        }
                        className={[
                          "flex min-h-[44px] sm:min-h-[86px] flex-col rounded-lg border p-1 sm:p-2 text-left text-xs transition",

                          /* Sunday */
                          day.isSunday
                            ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500"

                            /* APPROVED LEAVE */
                            : isLeave
                              ? "cursor-not-allowed border-amber-200 bg-amber-50 text-amber-700"

                              /* Future */
                              : day.isFuture
                                ? "cursor-not-allowed border-dashed bg-muted/30 text-muted-foreground"

                                /* Work log */
                                : day.log
                                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10"

                                  /* Empty */
                                  : "border-border bg-background hover:bg-muted/50",

                          !clickable
                            ? "opacity-80"
                            : "",
                        ].join(" ")}
                      >
                        {/* DATE */}
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs sm:text-sm">
                            {dayNumber}
                          </span>

                          {(isLeave ||
                            !day.isEditable ||
                            day.isSunday) && (
                            <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>

                        {/* Mobile compact dot indicator */}
                        <div className="flex sm:hidden items-center justify-center mt-1">
                          {isLeave ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          ) : day.log ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          ) : !day.isFuture && !day.isSunday ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          ) : null}
                        </div>

                        {/* Desktop text content */}
                        <div className="hidden sm:block">
                          {isLeave ? (
                            <div className="mt-2 flex items-center gap-1.5 font-semibold text-amber-700">
                              <CalendarOff className="h-3.5 w-3.5" />
                              <span>LEAVE</span>
                            </div>
                          ) : (
                            <span className="mt-1 line-clamp-3 whitespace-pre-wrap text-muted-foreground">
                              {day.log?.summary ||
                                statusLabel(day)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* WORK LOG DIALOG */}
      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) =>
          !open &&
          setSelectedDay(null)
        }
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? formatFullDate(
                    selectedDay.date
                  )
                : ""}
            </DialogTitle>

            <DialogDescription>
              {readOnly
                ? "Viewing this team member's work log for the day."
                : "Add or update the work log for this day."}
            </DialogDescription>
          </DialogHeader>

          {selectedDay &&
            !selectedDay.leave && (
              <WorkLogForm
                date={selectedDay.date}
                initialWorkLog={
                  selectedDay.log
                }
                readOnly={readOnly}
                onSaved={() => {
                  setSelectedDay(null);
                  mutate();
                }}
              />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatFullDate(
  isoDate: string
) {
  const [y, m, d] =
    isoDate
      .split("-")
      .map(Number);

  return new Date(
    y,
    m - 1,
    d
  ).toLocaleDateString(
    undefined,
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}