"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn, formatDateTime } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clapperboard, MapPin, Plus } from "lucide-react";
import { useShootCalendar } from "@/hooks/useShoots";
import { ShootLogForm } from "@/components/forms/ShootLogForm";
import { ShootReturnForm } from "@/components/forms/ShootReturnForm";
import { canViewShootLogOf } from "@/utils/permissions";
import type { IShootLog } from "@/types";

/**
 * Month calendar for shoots — a shared schedule everyone (Employee, Admin,
 * Super Admin) can see, same as the other team calendars in the app.
 *
 * Each shoot is plotted on its own `shootDate` — this is a booking/schedule
 * view, not a check-in/check-out log, so equipment checkout/return
 * timestamps don't factor into placement. Its current status (still out /
 * returned) is still shown as a small badge, since that's useful context,
 * but it doesn't change which day the shoot appears on.
 *
 * Adding a shoot straight from the calendar is limited to Admin/Super
 * Admin via `canAdd`; marking one returned from the detail view is decided
 * per-log with the same `canViewShootLogOf` rule the return API enforces,
 * so a shoot's owner (or whoever has oversight of their role) sees the
 * return form and everyone else gets a read-only view.
 */
export function ShootCalendar({ canAdd = false }: { canAdd?: boolean }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = session?.user?.id as string | undefined;

  const [anchor, setAnchor] = useState(new Date());
  const year = anchor.getFullYear();
  const month = anchor.getMonth() + 1;

  const { data, isLoading } = useShootCalendar(year, month);
  const shoots = data?.items ?? [];

  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [viewing, setViewing] = useState<IShootLog | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchor));
    const end = endOfWeek(endOfMonth(anchor));
    return eachDayOfInterval({ start, end });
  }, [anchor]);

  const shootsByDay = useMemo(() => {
    const map = new Map<string, IShootLog[]>();
    for (const shoot of shoots) {
      const key = format(new Date(shoot.shootDate), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(shoot);
    }
    return map;
  }, [shoots]);

  const canManageViewing =
    !!viewing && userId
      ? canViewShootLogOf(role, userId, viewing.takenBy, viewing.takenByRole)
      : false;

  if (isLoading) {
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
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => setAnchor((a) => subMonths(a, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-40 text-center text-sm font-semibold">{format(anchor, "MMMM yyyy")}</span>
        <Button variant="outline" size="icon" onClick={() => setAnchor((a) => addMonths(a, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAnchor(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 auto-rows-[6.5rem] sm:auto-rows-[7.5rem]">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayShoots = shootsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={cn(
                "group relative flex flex-col gap-1 overflow-hidden rounded-xl border border-border p-1.5 text-left",
                !inMonth && "opacity-40",
                isToday && "border-primary/60 bg-primary/5",
                dayShoots.length > 0 && "border-primary/40 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium", isToday && "text-primary")}>{format(day, "d")}</span>
                {canAdd && (
                  <button
                    onClick={() => setAddingDate(key)}
                    className="hidden text-muted-foreground hover:text-primary group-hover:block"
                    title="Add shoot"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayShoots.map((shoot) => (
                  <button
                    key={shoot._id}
                    onClick={() => setViewing(shoot)}
                    title={shoot.shootTitle}
                    className={cn(
                      "flex w-full items-center gap-1 rounded-lg bg-primary/10 px-1.5 py-1 text-left text-[11px] font-medium leading-tight text-primary",
                      "hover:bg-primary/20"
                    )}
                  >
                    <Clapperboard className="h-2.5 w-2.5 shrink-0" />
                    <span className="flex-1 truncate">{shoot.shootTitle}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add a shoot directly from the calendar */}
      <Dialog open={!!addingDate} onOpenChange={(open) => !open && setAddingDate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log equipment checkout</DialogTitle>
            <DialogDescription>
              {addingDate ? format(new Date(addingDate), "MMMM d, yyyy") : "Select what's being taken for the shoot."}
            </DialogDescription>
          </DialogHeader>
          {addingDate && <ShootLogForm defaultDate={addingDate} onSuccess={() => setAddingDate(null)} />}
        </DialogContent>
      </Dialog>

      {/* Shoot detail / mark returned */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewing?.shootTitle}</DialogTitle>
            <DialogDescription asChild>
              {viewing && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span>{format(new Date(viewing.shootDate), "MMMM d, yyyy")}</span>
                    <span>·</span>
                    <span>{viewing.takenByName}</span>
                  </div>
                  {viewing.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {viewing.location}
                    </div>
                  )}
                  <div>Checked out {formatDateTime(viewing.checkedOutAt)}</div>
                  {viewing.returnedAt && <div>Checked in {formatDateTime(viewing.returnedAt)}</div>}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <Badge variant={viewing.status === "OUT" ? "warning" : "success"}>
                {viewing.status === "OUT" ? "Equipment still out" : "Equipment returned"}
              </Badge>
              <div className="space-y-1 rounded-lg border border-border p-2 text-xs">
                {viewing.items.map((item) => (
                  <div key={item.equipment} className="flex items-center justify-between">
                    <span>{item.equipmentName}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              {viewing.status === "OUT" && canManageViewing && (
                <ShootReturnForm log={viewing} onSuccess={() => setViewing(null)} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
