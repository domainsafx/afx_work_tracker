import type { TaskStage } from "@/types";

/**
 * Client-delivery checklist stage config — single source of truth for the
 * label, ordering, and color used to render a task's stage across the app
 * (admin "Today" view, task lists, etc).
 */
export const TASK_STAGE_ORDER: TaskStage[] = [
  "CHECKLIST",
  "WIP",
  "WAITING_FOR_APPROVAL",
  "CHANGES_TO_BE_MADE",
  "SENT_TO_CLIENT",
  "FINALIZED",
  "CLOSED",
];

export const TASK_STAGE_LABEL: Record<TaskStage, string> = {
  CHECKLIST: "Checklist",
  WIP: "WIP",
  WAITING_FOR_APPROVAL: "Waiting for Approval",
  CHANGES_TO_BE_MADE: "Changes to be Made",
  SENT_TO_CLIENT: "Sent to Client",
  FINALIZED: "Finalized",
  CLOSED: "Closed",
};

// Tailwind classes follow the same "bg-x/15 text-x" pattern as components/ui/badge.tsx,
// just reaching for a couple of extra palette hues so all 7 stages stay visually distinct.
export const TASK_STAGE_COLOR: Record<TaskStage, string> = {
  CHECKLIST: "bg-secondary text-secondary-foreground",
  WIP: "bg-primary/15 text-primary",
  WAITING_FOR_APPROVAL: "bg-warning/15 text-warning",
  CHANGES_TO_BE_MADE: "bg-destructive/15 text-destructive",
  SENT_TO_CLIENT: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  FINALIZED: "bg-success/15 text-success",
  CLOSED: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

export const TASK_STAGE_DOT: Record<TaskStage, string> = {
  CHECKLIST: "bg-secondary-foreground/50",
  WIP: "bg-primary",
  WAITING_FOR_APPROVAL: "bg-warning",
  CHANGES_TO_BE_MADE: "bg-destructive",
  SENT_TO_CLIENT: "bg-sky-500",
  FINALIZED: "bg-success",
  CLOSED: "bg-slate-500",
};
