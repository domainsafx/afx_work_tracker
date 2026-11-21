import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import ShootLog from "@/models/ShootLog";
import { equipmentService, getOutstandingQuantities } from "./equipmentService";
import { getWorkLogVisibleRoles } from "@/utils/permissions";
import { withDistributedLock } from "@/lib/distributedLock";
import type { UserRole } from "@/types";

export const shootLogService = {
  /**
   * Checkout: creates the log with the selected equipment. Denormalizes
   * equipment name/category at the time of taking so the log stays
   * accurate even if the catalog entry is edited or retired later.
   *
   * Uses distributed atomic locking across all application instances and replica set transactions
   * (when supported) to guarantee zero overselling or negative inventory.
   */
  async create(input: {
    shootTitle: string;
    shootDate: string;
    location?: string;
    items: { equipmentId: string; quantity: number; takeNote?: string }[];
    takenBy: { id: string; name: string; role: UserRole };
  }) {
    await connectDB();

    return withDistributedLock(
      "equipment_checkout",
      async () => {
        let session: mongoose.ClientSession | undefined;

        try {
          session = await mongoose.startSession();
        } catch {
          session = undefined;
        }

        const executeReservation = async (activeSession?: mongoose.ClientSession) => {
          const equipmentIds = input.items.map((i) => i.equipmentId);
          const catalogItems = await equipmentService.findByIds(equipmentIds, activeSession);
          const catalogMap = new Map(catalogItems.map((c: any) => [c._id.toString(), c]));
          const outstanding = await getOutstandingQuantities(activeSession);

          const items = input.items.map((i) => {
            const catalogItem: any = catalogMap.get(i.equipmentId);
            if (!catalogItem) throw new Error("One of the selected equipment items no longer exists");

            const available = Math.max(0, catalogItem.totalQuantity - (outstanding.get(i.equipmentId) ?? 0));
            if (i.quantity > available) {
              throw new Error(`Only ${available} of "${catalogItem.name}" available right now`);
            }

            return {
              equipment: i.equipmentId,
              equipmentName: catalogItem.name,
              category: catalogItem.category,
              quantity: i.quantity,
              takeNote: i.takeNote,
            };
          });

          const logDoc = new ShootLog({
            shootTitle: input.shootTitle,
            shootDate: new Date(input.shootDate),
            location: input.location,
            takenBy: input.takenBy.id,
            takenByName: input.takenBy.name,
            takenByRole: input.takenBy.role,
            items,
            status: "OUT",
            checkedOutAt: new Date(),
          });

          if (activeSession) {
            await logDoc.save({ session: activeSession });
          } else {
            await logDoc.save();
          }

          return logDoc.toObject();
        };

        if (session) {
          try {
            let result: any;
            await session.withTransaction(async () => {
              result = await executeReservation(session);
            });
            return result;
          } catch (err: any) {
            if (err?.message?.includes("replica set") || err?.message?.includes("Transaction numbers")) {
              // Graceful fallback for non-replica set MongoDB environments
              return executeReservation();
            }
            throw err;
          } finally {
            await session.endSession().catch(() => {});
          }
        }

        return executeReservation();
      },
      { ttlMs: 10_000, waitTimeoutMs: 5_000 }
    );
  },

  async findById(id: string) {
    await connectDB();
    return ShootLog.findById(id).lean();
  },

  async listMine(userId: string) {
    await connectDB();
    return ShootLog.find({ takenBy: userId }).sort({ createdAt: -1 }).lean();
  },

  /**
   * Team view: same role-hierarchy scoping as work logs — an Admin sees
   * Employees' logs, the Super Admin sees everyone's, an Employee only
   * ever sees their own (so this is only meaningful for Admin/Super Admin).
   */
  async listTeam(viewerRole: UserRole) {
    await connectDB();
    const visibleRoles = getWorkLogVisibleRoles(viewerRole);
    if (visibleRoles.length === 0) return [];
    return ShootLog.find({ takenByRole: { $in: visibleRoles } }).sort({ createdAt: -1 }).lean();
  },

  /**
   * Calendar view: every shoot scheduled in the given month, keyed off
   * `shootDate` — the shoot's own date, not its equipment check-out/check-in
   * timestamps. This is a shared schedule, so it's intentionally NOT scoped
   * by role or ownership: every signed-in user (Employee, Admin, Super
   * Admin) sees the same list of what's booked. Adding to it is restricted
   * separately (client-side gating + the existing POST /api/shoots
   * permission), and returning equipment is still governed per-log by
   * canViewShootLogOf, same as everywhere else.
   */
  async listForCalendar(year: number, month: number) {
    await connectDB();

    const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    return ShootLog.find({ shootDate: { $gte: monthStart, $lte: monthEnd } })
      .sort({ shootDate: 1 })
      .lean();
  },

  /**
   * Return: records returned items (with conditions and notes) and marks log returned.
   */
  async markReturned(
    id: string,
    input: {
      returnNote?: string;
      items: {
        equipmentId: string;
        returnCondition: "OK" | "DAMAGED" | "MISSING";
        returnNote?: string;
      }[];
    }
  ) {
    await connectDB();

    const log = await ShootLog.findById(id);
    if (!log) throw new Error("Shoot log not found");
    if (log.status === "RETURNED") throw new Error("This equipment has already been marked as returned");

    // Merge return details into each item on the log
    const returnMap = new Map(input.items.map((r) => [r.equipmentId, r]));

    for (const item of log.items) {
      const ret = returnMap.get(item.equipment.toString());
      if (ret) {
        item.returnCondition = ret.returnCondition;
        item.returnNote = ret.returnNote;
      }
    }

    log.status = "RETURNED";
    log.returnedAt = new Date();
    log.returnNote = input.returnNote;

    await log.save();
    return log.toObject();
  },
};
