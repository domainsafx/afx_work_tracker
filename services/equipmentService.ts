import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Equipment from "@/models/Equipment";
import ShootLog from "@/models/ShootLog";

/** How much of each equipment item is currently checked out (status "OUT"), keyed by equipment id. */
export async function getOutstandingQuantities(session?: mongoose.ClientSession): Promise<Map<string, number>> {
  const query = ShootLog.aggregate([
    { $match: { status: "OUT" } },
    { $unwind: "$items" },
    { $group: { _id: "$items.equipment", quantity: { $sum: "$items.quantity" } } },
  ]);
  if (session) {
    query.session(session);
  }
  const rows = await query;
  return new Map(rows.map((r: any) => [r._id.toString(), r.quantity]));
}

export const equipmentService = {
  /**
   * Active items by default — pass includeInactive for the management view.
   * Each item is annotated with `availableQuantity` (totalQuantity minus
   * whatever's currently checked out on an open shoot log) so the checkout
   * form can show real stock and stop people over-booking gear.
   */
  async list(includeInactive = false) {
    await connectDB();
    const filter = includeInactive ? {} : { isActive: true };
    const [items, outstanding] = await Promise.all([
      Equipment.find(filter).sort({ category: 1, name: 1 }).lean(),
      getOutstandingQuantities(),
    ]);
    return items.map((item: any) => ({
      ...item,
      availableQuantity: Math.max(0, item.totalQuantity - (outstanding.get(item._id.toString()) ?? 0)),
    }));
  },

  async create(input: {
    name: string;
    category: string;
    code?: string;
    notes?: string;
    createdBy: string;
    createdByName: string;
  }) {
    await connectDB();
    const item = await Equipment.create(input);
    return item.toObject();
  },

  async update(id: string, input: Partial<{ name: string; category: string; code: string; notes: string; isActive: boolean }>) {
    await connectDB();
    return Equipment.findByIdAndUpdate(id, input, { new: true }).lean();
  },

  async delete(id: string) {
    await connectDB();
    return Equipment.findByIdAndDelete(id).lean();
  },

  async findByIds(ids: string[], session?: mongoose.ClientSession) {
    await connectDB();
    const query = Equipment.find({ _id: { $in: ids } });
    if (session) query.session(session);
    return query.lean();
  },
};
