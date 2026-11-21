"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Link2, MessageSquareWarning, Save, ExternalLink, Plus, Trash2 } from "lucide-react";
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
  stageLinks,
  stageNote,
  canEdit,
}: {
  taskId: string;
  stage: TaskStage;
  stageLink?: string;
  stageLinks?: string[];
  stageNote?: string;
  canEdit: boolean;
}) {
  const updateStage = useUpdateTaskStage(taskId);

  const initialLinks =
    stageLinks && stageLinks.length > 0
      ? stageLinks
      : stageLink
        ? [stageLink]
        : [""];

  const [links, setLinks] = useState<string[]>(initialLinks);
  const [note, setNote] = useState(stageNote ?? "");

  const currentIndex = TASK_STAGE_ORDER.indexOf(stage);

  function addLink() {
    setLinks([...links, ""]);
  }

  function updateLink(index: number, value: string) {
    const updated = [...links];
    updated[index] = value;
    setLinks(updated);
  }

  function removeLink(index: number) {
    if (links.length <= 1) {
      setLinks([""]);
    } else {
      setLinks(links.filter((_, i) => i !== index));
    }
  }

  const cleanedLinks = links.map((l) => l.trim()).filter(Boolean);

  function moveTo(next: TaskStage) {
    if (!canEdit || updateStage.isPending) return;
    toast.promise(
      updateStage.mutateAsync({
        stage: next,
        link: cleanedLinks[0] ?? "",
        links: cleanedLinks,
        note,
      }),
      {
        loading: "Updating checklist...",
        success: `Moved to ${TASK_STAGE_LABEL[next]}`,
        error: (err) => err?.message ?? "Failed to update checklist",
      }
    );
  }

  function saveDetails() {
    toast.promise(
      updateStage.mutateAsync({
        stage,
        link: cleanedLinks[0] ?? "",
        links: cleanedLinks,
        note,
      }),
      {
        loading: "Saving...",
        success: "Checklist details saved",
        error: (err) => err?.message ?? "Failed to save",
      }
    );
  }

  const baselineLinks =
    stageLinks && stageLinks.length > 0
      ? stageLinks.filter(Boolean)
      : stageLink
        ? [stageLink]
        : [];

  const detailsDirty =
    JSON.stringify(cleanedLinks) !== JSON.stringify(baselineLinks) ||
    note !== (stageNote ?? "");

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
                  "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 min-h-[44px] text-left text-sm transition-colors",
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

        <div className="space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5 text-xs font-semibold">
                <Link2 className="h-3.5 w-3.5" /> Upload Content / Deliverable Links
              </Label>
              {canEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                  className="h-8 gap-1 text-xs text-primary px-2.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another
                </Button>
              )}
            </div>

            {canEdit ? (
              <div className="space-y-2">
                {links.map((lnk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={lnk}
                      onChange={(e) => updateLink(idx, e.target.value)}
                      placeholder={`Paste Drive, Dropbox, Frame.io or deliverable link #${idx + 1}`}
                      className="text-sm"
                    />
                    {links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLink(idx)}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Paste links to deliverables (Google Drive, Vimeo, Frame.io, etc.). Click &quot;+ Add another&quot; to upload/attach multiple content links.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {cleanedLinks.length > 0 ? (
                  cleanedLinks.map((lnk, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <a
                        href={lnk.startsWith("http") ? lnk : `https://${lnk}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                      >
                        {lnk} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No content uploaded yet.</p>
                )}
              </div>
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
            <Button size="sm" variant="outline" className="w-full sm:w-auto h-9 text-xs" onClick={saveDetails} disabled={!detailsDirty || updateStage.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> Save details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
