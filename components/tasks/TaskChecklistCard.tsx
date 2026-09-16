"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Link2, MessageSquareWarning, Save, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TASK_STAGE_ORDER, TASK_STAGE_LABEL, TASK_STAGE_DOT } from "@/lib/taskStage";
import { useUpdateTaskStage } from "@/hooks/useTasks";
import type { TaskStage } from "@/types";

/**
 * The full client-delivery checklist for a task: every stage as a row you
 * can jump to directly, plus the drive link and change-notes fields that
 * travel with whichever stage is current (e.g. paste the deliverable link
 * once it's "Sent to Client", or note what changes were asked for).
 */
export function TaskChecklistCard({
  taskId,
  stage,
  stageLink,
  stageNote,
  canEdit,
}: {
  taskId: string;
  stage: TaskStage;
  stageLink?: string;
  stageNote?: string;
  canEdit: boolean;
}) {
  const updateStage = useUpdateTaskStage(taskId);
  const [link, setLink] = useState(stageLink ?? "");
  const [note, setNote] = useState(stageNote ?? "");

  const currentIndex = TASK_STAGE_ORDER.indexOf(stage);

  function moveTo(next: TaskStage) {
    if (!canEdit || updateStage.isPending) return;
    toast.promise(updateStage.mutateAsync({ stage: next, link, note }), {
      loading: "Updating checklist...",
      success: `Moved to ${TASK_STAGE_LABEL[next]}`,
      error: (err) => err?.message ?? "Failed to update checklist",
    });
  }

  function saveDetails() {
    toast.promise(updateStage.mutateAsync({ stage, link, note }), {
      loading: "Saving...",
      success: "Checklist details saved",
      error: (err) => err?.message ?? "Failed to save",
    });
  }

  const detailsDirty = link !== (stageLink ?? "") || note !== (stageNote ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task checklist</CardTitle>
        <CardDescription>
          {canEdit ? "Click a step to move this task through the delivery pipeline." : "Delivery pipeline progress for this task."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          {TASK_STAGE_ORDER.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <button
                key={s}
                type="button"
                disabled={!canEdit || updateStage.isPending}
                onClick={() => moveTo(s)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "border-primary/40 bg-primary/5 font-medium text-foreground"
                    : done
                      ? "border-transparent text-muted-foreground hover:bg-secondary/60"
                      : "border-transparent text-muted-foreground/70 hover:bg-secondary/60",
                  !canEdit && "cursor-default hover:bg-transparent"
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <Circle className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground/40")} />
                )}
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active && TASK_STAGE_DOT[s])} />
                {TASK_STAGE_LABEL[s]}
              </button>
            );
          })}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <Link2 className="h-3.5 w-3.5" /> Drive / content link
            </Label>
            {canEdit ? (
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste a drive link once the deliverable is ready to share"
              />
            ) : stageLink ? (
              <a
                href={stageLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {stageLink} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No link added yet.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs">
              <MessageSquareWarning className="h-3.5 w-3.5" /> Changes / notes
            </Label>
            {canEdit ? (
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What changes were asked for, or any other note on this stage"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{stageNote || "No notes added yet."}</p>
            )}
          </div>

          {canEdit && (
            <Button size="sm" variant="outline" onClick={saveDetails} disabled={!detailsDirty || updateStage.isPending}>
              <Save className="h-3.5 w-3.5" /> Save details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
