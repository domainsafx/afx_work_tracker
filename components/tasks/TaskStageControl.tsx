"use client";

import { cn } from "@/lib/utils";
import { TASK_STAGE_ORDER, TASK_STAGE_LABEL, TASK_STAGE_COLOR, TASK_STAGE_DOT } from "@/lib/taskStage";
import type { TaskStage } from "@/types";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/** Static, read-only pill for a task's checklist stage. */
export function TaskStageBadge({ stage, className }: { stage: TaskStage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TASK_STAGE_COLOR[stage],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", TASK_STAGE_DOT[stage])} />
      {TASK_STAGE_LABEL[stage]}
    </span>
  );
}

/** Dropdown for admins to move a task's checklist stage forward or back. */
export function TaskStageSelect({
  stage,
  onChange,
  disabled,
}: {
  stage: TaskStage;
  onChange: (stage: TaskStage) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={stage} onValueChange={(v) => onChange(v as TaskStage)} disabled={disabled}>
      <SelectTrigger className="h-8 w-full sm:w-[190px] text-xs">
        <SelectValue>
          <TaskStageBadge stage={stage} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {TASK_STAGE_ORDER.map((s) => (
          <SelectItem key={s} value={s}>
            <TaskStageBadge stage={s} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
