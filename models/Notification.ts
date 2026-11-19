import mongoose, { Schema, Model } from "mongoose";
import type { INotification } from "@/types";

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "DEADLINE_APPROACHING",
        "TASK_COMPLETED",
        "TASK_ISSUE",
        "DELAY_SUBMITTED",
        "DELAY_REVIEWED",
        "MEETING_SCHEDULED",
        "MEETING_CANCELLED",
        "TASK_UPDATE_REQUESTED",
        "TASK_UPDATE_REVIEWED",
        "LEAVE_REQUESTED",
        "LEAVE_REVIEWED",
        "LEAVE_WITHDRAWN",
        "HOLIDAY_ADDED",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    relatedTask: { type: Schema.Types.ObjectId, ref: "Task" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Notification: Model<INotification> =
  mongoose.models?.Notification || mongoose.model<INotification>("Notification", NotificationSchema);
export default Notification;
