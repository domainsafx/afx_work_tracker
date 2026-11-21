import mongoose, { Schema, Model, Document } from "mongoose";

export interface ISystemLockDoc extends Document {
  key: string;
  lockedBy: string;
  lockedAt: Date;
  lockedUntil: Date;
}

const SystemLockSchema = new Schema<ISystemLockDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    lockedBy: { type: String, required: true },
    lockedAt: { type: Date, required: true },
    lockedUntil: { type: Date, required: true },
  },
  { timestamps: true }
);

const SystemLock: Model<ISystemLockDoc> =
  mongoose.models?.SystemLock ||
  mongoose.model<ISystemLockDoc>("SystemLock", SystemLockSchema);

export default SystemLock;
