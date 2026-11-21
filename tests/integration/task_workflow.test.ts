import { describe, it, expect } from "vitest";
import {
  createTaskSchema,
  taskProgressUpdateSchema,
  updateTaskStageSchema,
  delaySubmissionSchema,
  transferRequestSchema,
} from "@/lib/validations";

describe("Integration: Task Lifecycle & Workflow", () => {
  it("validates task assignment with default start date and no estimated time requirement", () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const input = {
      title: "Color Grading Feature Film",
      description: "Color grade scenes 1 through 10 in DaVinci Resolve",
      assignedTo: "507f1f77bcf86cd799439011",
      department: "Colorist",
      priority: "HIGH",
      startDate: todayStr,
      deadline: tomorrowStr,
    };

    const parsed = createTaskSchema.safeParse(input);
    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.startDate).toBe(todayStr);
      expect((parsed.data as any).estimatedTime).toBeUndefined();
    }
  });

  it("validates task progress update submissions", () => {
    const updateInput = {
      progressPercent: 75,
      workDone: "Completed initial color pass for scenes 1 through 5",
      comment: "Awaiting client LUT confirmation",
    };

    const parsed = taskProgressUpdateSchema.safeParse(updateInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.progressPercent).toBe(75);
    }
  });

  it("validates stage transition and delay submission", () => {
    const stageInput = { stage: "WIP" as const };
    expect(updateTaskStageSchema.safeParse(stageInput).success).toBe(true);

    const delayInput = {
      reason: "Waiting for raw footage ingest from shoot unit B",
      expectedCompletionDate: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    };
    const parsedDelay = delaySubmissionSchema.safeParse(delayInput);
    expect(parsedDelay.success).toBe(true);
  });

  it("validates task transfer request workflow", () => {
    const transferInput = {
      transferTo: "507f1f77bcf86cd799439022",
      reason: "Reallocating due to unscheduled shoot day requirements",
    };
    const parsed = transferRequestSchema.safeParse(transferInput);
    expect(parsed.success).toBe(true);
  });
});
