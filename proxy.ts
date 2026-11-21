import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/api/auth",
  "/download",
];

const ADMIN_ONLY_PATHS = [
  "/dashboard/employees/new",
  "/dashboard/admins",
];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

  // Allow scheduled cron job invocation if valid CRON_SECRET authorization header is present
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorizedCron =
    nextUrl.pathname === "/api/system/reconcile" &&
    Boolean(cronSecret) &&
    authHeader === `Bearer ${cronSecret}`;

  if (isPublic || isAuthorizedCron) return NextResponse.next();

  const session = req.auth;
  const isApiRoute = nextUrl.pathname.startsWith("/api/");

  // Not logged in
  if (!session?.user) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Deactivated account -> block access
  if ((session.user as any).isActive === false) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      );
    }
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("disabled", "1");
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any).role as string;

  // Route-level role protection for admin-only screens
  const requiresAdmin = ADMIN_ONLY_PATHS.some((p) => nextUrl.pathname.startsWith(p));
  if (requiresAdmin && role !== "SUPER_ADMIN") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // Employees cannot access the admin task-assignment / employee-management area
  if (nextUrl.pathname.startsWith("/dashboard/employees") && role === "EMPLOYEE") {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
