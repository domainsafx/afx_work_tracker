import { Schema, model, models, Model, Document } from "mongoose";

export interface IClientDoc extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  // Per-client reference links. `mouLink` is only ever surfaced to Super Admins
  // (enforced at the API layer, not just the UI) since it holds contractual info.
  deckLink?: string;
  deliverablesLink?: string;
  contentLink?: string;
  mouLink?: string;
  createdBy: Schema.Types.ObjectId;
  createdByName: string;
}

const ClientSchema = new Schema<IClientDoc>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    deckLink: { type: String, trim: true },
    deliverablesLink: { type: String, trim: true },
    contentLink: { type: String, trim: true },
    mouLink: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

const Client: Model<IClientDoc> = models.Client || model<IClientDoc>("Client", ClientSchema);
export default Client;
