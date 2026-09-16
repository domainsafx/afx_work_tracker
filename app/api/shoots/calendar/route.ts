import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { shootLogService } from "@/services/shootLogService";
import { shootCalendarQuerySchema } from "@/lib/validations";

/**
 * GET /api/shoots/calendar?year=2026&month=9
 *
 * Month view for the Shoots calendar — a shared schedule visible to every
 * signed-in user (Employee, Admin, Super Admin), same as the rest of the
 * team calendars. Shoots are plotted by their own `shootDate`; who's
 * allowed to add a new one to the calendar is enforced separately (the
 * underlying POST /api/shoots permission, gated in the UI to Admin/Super
 * Admin for this entry point).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const parsed = shootCalendarQuerySchema.safeParse({
    year: searchParams.get("year") ?? now.getFullYear(),
    month: searchParams.get("month") ?? now.getMonth() + 1,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { year, month } = parsed.data;

  try {
    const items = await shootLogService.listForCalendar(year, month);
    return NextResponse.json({ year, month, items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load shoots calendar." }, { status: 500 });
  }
}
