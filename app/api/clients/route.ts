import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clientService } from "@/services/clientService";
import { createClientSchema } from "@/lib/validations";
import { can } from "@/utils/permissions";

// GET /api/clients — visible to everyone (Employees pick a client to view its delivery calendar).
// The MOU link is contractual and is only ever sent down to Super Admins.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  const items = await clientService.list();
  const sanitized = role === "SUPER_ADMIN" ? items : items.map((c: any) => ({ ...c, mouLink: undefined }));
  return NextResponse.json({ items: sanitized });
}

// POST /api/clients — Admin/Super Admin create a new client (and its calendar)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!can(role, "MANAGE_CLIENTS")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // MOU link is Super Admin-only, even if slipped into the request body.
  const data = { ...parsed.data };
  if (role !== "SUPER_ADMIN") delete (data as any).mouLink;

  try {
    const client = await clientService.create({
      ...data,
      createdBy: session.user.id as string,
      createdByName: session.user.name ?? "Admin",
    });
    return NextResponse.json(client, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to create client" }, { status: 400 });
  }
}
