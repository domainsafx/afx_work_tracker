"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useConversations } from "@/hooks/useChat";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  FileBarChart,
  UserCircle,
  Bell,
  ArrowRightLeft,
  ClipboardList,
  MessageSquare,
  CalendarClock,
  PartyPopper,
  CalendarDays,
  Camera,
  PackageCheck,
  ShieldCheck,
  Building2,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
};

const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  // { href: "/dashboard/messages", label: "Messages", icon: MessageSquare, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  // { href: "/dashboard/meetings", label: "Meetings", icon: CalendarClock, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/shoots", label: "Shoots", icon: Camera, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/deliveries", label: "Posting Schedule", icon: PackageCheck, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/transfers", label: "Transfers", icon: ArrowRightLeft, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/work-log", label: "Work Log", icon: ClipboardList, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  // { href: "/dashboard/leave", label: "Leave", icon: CalendarDays, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  // { href: "/dashboard/holidays", label: "Holidays", icon: PartyPopper, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
];

const MANAGEMENT_NAV: NavItem[] = [
  { href: "/dashboard/employees", label: "Employees", icon: Users, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/clients", label: "Clients", icon: Building2, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart, roles: ["SUPER_ADMIN", "ADMIN"] },
];

const GENERAL_NAV: NavItem[] = [
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle, roles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE"] },
];

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EMPLOYEE: "Employee",
};

type SidebarProps = {
  role: string;
  onNavigate?: () => void;
};

function NavLink({
  item,
  active,
  badgeCount,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badgeCount: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {badgeCount > 0 && (
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold",
            active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground"
          )}
        >
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  title,
  items,
  role,
  pathname,
  unreadMessages,
  onNavigate,
}: {
  title?: string;
  items: NavItem[];
  role: string;
  pathname: string;
  unreadMessages: number;
  onNavigate?: () => void;
}) {
  const visible = items.filter((item) => item.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      {title && (
        <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </p>
      )}
      {visible.map((item) => {
        const active =
          pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const badgeCount = item.href === "/dashboard/messages" ? unreadMessages : 0;
        return (
          <NavLink key={item.href} item={item} active={active} badgeCount={badgeCount} onNavigate={onNavigate} />
        );
      })}
    </div>
  );
}

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: convoData } = useConversations();
  const unreadMessages = (convoData?.items ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card p-4">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
          AFX
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">AFX Digital</p>
          <p className="text-xs text-muted-foreground">Work Tracker</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
        <NavSection items={WORKSPACE_NAV} role={role} pathname={pathname} unreadMessages={unreadMessages} onNavigate={onNavigate} />
        <NavSection title="Management" items={MANAGEMENT_NAV} role={role} pathname={pathname} unreadMessages={unreadMessages} onNavigate={onNavigate} />
        <NavSection title="General" items={GENERAL_NAV} role={role} pathname={pathname} unreadMessages={unreadMessages} onNavigate={onNavigate} />
      </nav>

      <div className="mt-3">
        <InstallAppButton className="w-full justify-center" />
      </div>

      <div
        className={cn(
          "mt-3 flex items-center gap-2 rounded-xl border p-3 text-xs",
          isSuperAdmin
            ? "border-primary/25 bg-primary/10 text-primary"
            : "border-border bg-secondary/40 text-muted-foreground"
        )}
      >
        {isSuperAdmin && <ShieldCheck className="h-4 w-4 shrink-0" />}
        <span>
          Signed in as{" "}
          <span className={cn("font-semibold", isSuperAdmin ? "text-primary" : "text-foreground")}>
            {ROLE_LABEL[role] ?? role}
          </span>
        </span>
      </div>
    </aside>
  );
}

