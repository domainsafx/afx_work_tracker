"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import Link from "next/link";
import AvailabilityStatus from "@/components/common/AvailabilityStatus";
import { Sidebar } from "./Sidebar";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
};

export function Navbar({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const { data } = useNotifications();

  const unread =
    data?.items?.filter((n: any) => !n.isRead).length ?? 0;

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer after navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-card/80 px-4 py-3 md:px-6">
        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 transition hover:bg-secondary"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
              AFX
            </div>
            <span className="font-semibold">AFX Digital</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div>
            <p className="text-sm font-medium text-foreground">Hello, {name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">Welcome back to AFX Digital</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <AvailabilityStatus />

          <Link
            href="/dashboard/notifications"
            className="relative rounded-xl p-2 hover:bg-secondary"
          >
            <Bell className="h-5 w-5" />

            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-3 border-l border-border pl-3 md:flex">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="text-xs leading-tight">
              <div className="font-medium text-foreground">{name}</div>
              <div className="text-muted-foreground">{email}</div>
            </div>

            <Badge variant={role === "SUPER_ADMIN" ? "default" : "secondary"} className="ml-1">
              {ROLE_LABEL[role] ?? role}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            title="Sign out"
            onClick={() =>
              signOut({
                callbackUrl: `${window.location.origin}/login`,
              })
            }
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card shadow-xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end border-b border-border p-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Sidebar
          role={role}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </>
  );
}
