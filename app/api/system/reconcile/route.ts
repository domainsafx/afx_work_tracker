import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { reconciliationService } from "@/services/reconciliationService";

export async function POST(req: NextRequest) {
  // Check authorization: Bearer CRON_SECRET or Super Admin session
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  let authorized = false;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  } else {
    const session = await auth();
    if (session?.user && (session.user as any).role === "SUPER_ADMIN") {
      authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json(
      { error: "Unauthorized. Super Admin session or valid CRON_SECRET required." },
      { status: 401 }
    );
  }

  try {
    const result = await reconciliationService.reconcileAll();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Reconciliation failed" },
      { status: 500 }
    );
  }
}
