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

  // Lock background body scrolling when drawer is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  // Handle Escape key
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border bg-card/80 px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
        {/* Mobile Menu Trigger & Brand */}
        <div className="flex items-center gap-1.5 md:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
              AFX
            </div>
            <span className="hidden min-[380px]:inline text-sm font-semibold tracking-tight sm:text-base">AFX Digital</span>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <div>
            <p className="text-sm font-medium text-foreground">Hello, {name.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">Welcome back to AFX Digital</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <AvailabilityStatus />

          <Link
            href="/dashboard/notifications"
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-secondary"
          >
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />

            {unread > 0 && (
              <span className="absolute 1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>

          <div className="hidden items-center gap-2.5 border-l border-border pl-3 md:flex">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="text-xs leading-tight hidden lg:block">
              <div className="font-medium text-foreground">{name}</div>
              <div className="text-muted-foreground">{email}</div>
            </div>

            <Badge variant={role === "SUPER_ADMIN" ? "default" : "secondary"} className="ml-1 hidden xl:inline-flex">
              {ROLE_LABEL[role] ?? role}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            title="Sign out"
            aria-label="Sign out"
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

      {/* Mobile Overlay / Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        className={`fixed left-0 top-0 z-50 flex h-[100dvh] w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm">
              AFX
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">AFX Digital</p>
              <p className="text-[11px] text-muted-foreground">Work Tracker</p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Sidebar
            role={role}
            onNavigate={() => setOpen(false)}
          />
        </div>
      </div>
    </>
  );
}
