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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn, formatDateTime } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Pencil,
  Plus,
  User,
  CalendarDays,
  Presentation,
  PackageCheck,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { DeliveryEventForm } from "@/components/forms/DeliveryEventForm";
import type { IDeliveryEvent, IClient } from "@/types";

function dueStatus(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, variant: "destructive" as const };
  if (diffDays === 0) return { label: "Due today", variant: "warning" as const };
  if (diffDays === 1) return { label: "Due tomorrow", variant: "warning" as const };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, variant: "secondary" as const };
  return { label: "Upcoming", variant: "secondary" as const };
}

function WorkLink({ href, label, icon: Icon }: { href?: string; label: string; icon: any }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

export function DeliveryCalendar({
  clientId,
  client,
  events,
  loading,
  canManage,
  anchor,
  onAnchorChange,
}: {
  clientId: string;
  /** The selected client, so the deliverable popup can surface its work links (deck/content/deliverables) for whoever needs to action it. */
  client?: IClient;
  events: IDeliveryEvent[];
  loading?: boolean;
  canManage?: boolean;
  anchor: Date;
  onAnchorChange: (date: Date) => void;
}) {
  const [viewing, setViewing] = useState<IDeliveryEvent | null>(null);
  const [editing, setEditing] = useState<IDeliveryEvent | null>(null);
  const [addingDate, setAddingDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(anchor));
    const end = endOfWeek(endOfMonth(anchor));
    return eachDayOfInterval({ start, end });
  }, [anchor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, IDeliveryEvent[]>();
    for (const event of events) {
      const key = new Date(event.date).toISOString().split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

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
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => onAnchorChange(subMonths(anchor, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-40 text-center text-sm font-semibold">{format(anchor, "MMMM yyyy")}</span>
        <Button variant="outline" size="icon" onClick={() => onAnchorChange(addMonths(anchor, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onAnchorChange(new Date())}>
          Today
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 auto-rows-[6rem] sm:auto-rows-[7rem]">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, anchor);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={key}
              className={cn(
                "group relative flex flex-col gap-1 overflow-hidden rounded-xl border border-border p-1.5 text-left",
                !inMonth && "opacity-40",
                isToday && "border-primary/60 bg-primary/5",
                dayEvents.length > 0 && "border-primary/40 bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("text-xs font-medium", isToday && "text-primary")}>{format(day, "d")}</span>
                {canManage && (
                  <button
                    onClick={() => setAddingDate(key)}
                    className="hidden text-muted-foreground hover:text-primary group-hover:block"
                    title="Add delivery"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto">
                {dayEvents.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => setViewing(event)}
                    title={event.description || event.title}
                    className="flex w-full cursor-pointer items-center gap-1 rounded-lg bg-primary/10 px-1.5 py-1 text-left text-[11px] font-medium leading-tight text-primary hover:bg-primary/20"
                  >
                    <Package className="h-2.5 w-2.5 shrink-0" />
                    <span className="flex-1 truncate">{event.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery details — anyone can open this, regardless of edit rights.
          This is the "what do I need to do and where do I do it" view for
          whoever's assigned the work: full details plus one-click links to
          the client's deck/content/deliverables, no edit controls. */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription asChild>
              {viewing && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(new Date(viewing.date), "EEEE, MMMM d, yyyy")}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <Badge variant={dueStatus(new Date(viewing.date)).variant}>
                {dueStatus(new Date(viewing.date)).label}
              </Badge>

              {viewing.description && (
                <div className="rounded-lg border border-border bg-secondary/30 p-3 text-sm text-foreground/90">
                  {viewing.description}
                </div>
              )}

              {(client?.deckLink || client?.deliverablesLink || client?.contentLink) && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Work on it</p>
                  <div className="flex flex-wrap gap-2">
                    <WorkLink href={client?.deckLink} label="Deck" icon={Presentation} />
                    <WorkLink href={client?.contentLink} label="Content" icon={FolderOpen} />
                    <WorkLink href={client?.deliverablesLink} label="Deliverables" icon={PackageCheck} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Added by {viewing.createdByName}
                </div>
                <div>Created {formatDateTime(viewing.createdAt)}</div>
                {viewing.updatedAt && viewing.updatedAt !== viewing.createdAt && (
                  <div>Last updated {formatDateTime(viewing.updatedAt)}</div>
                )}
              </div>

              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    setEditing(viewing);
                    setViewing(null);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit delivery
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit / remove — Admin & Super Admin only */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit delivery date</DialogTitle>
            <DialogDescription>Update or remove this delivery entry.</DialogDescription>
          </DialogHeader>
          {editing && <DeliveryEventForm clientId={clientId} event={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!addingDate} onOpenChange={(open) => !open && setAddingDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add delivery date</DialogTitle>
            <DialogDescription>{addingDate ? format(new Date(addingDate), "MMMM d, yyyy") : ""}</DialogDescription>
          </DialogHeader>
          {addingDate && (
            <DeliveryEventForm clientId={clientId} defaultDate={addingDate} onSuccess={() => setAddingDate(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
