"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSetUserActive, useDeleteUser } from "@/hooks/useEmployees";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { MessageCircle, Trash2, UserCheck, UserX, Eye } from "lucide-react";
import { EditContactDialog } from "@/components/modals/EditContactDialog";

export function EmployeeTable({
  users,
  loading,
  canManage,
  onUpdateAvailability,
}: {
  users: any[];
  loading?: boolean;
  canManage: boolean;
  onUpdateAvailability: (user: any) => void;
}) {
  const setActive = useSetUserActive();
  const deleteUser = useDeleteUser();
  const [contactUser, setContactUser] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!users.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No employees found.
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View (< md) */}
      <div className="space-y-3 md:hidden">
        {users.map((u) => (
          <div key={u._id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/employees/${u._id}`}
                  className="font-semibold text-foreground hover:text-primary hover:underline text-sm truncate block"
                >
                  {u.name}
                </Link>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                {u.phone && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3 text-success shrink-0" />
                    <span>{u.phone}</span>
                    {u.whatsappOptIn === false && <span className="text-[10px] text-muted-foreground">(muted)</span>}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={u.isActive ? "success" : "destructive"} className="text-[10px] px-1.5 py-0">
                  {u.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {u.role.replace("_", " ")}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-y border-border/60 py-2">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Department</span>
                <span className="font-medium text-foreground">{u.department ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Designation</span>
                <span className="font-medium text-foreground truncate block">{u.designation ?? "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Availability</span>
                <Badge
                  variant={
                    u.availabilityStatus === "ACTIVE"
                      ? "success"
                      : u.availabilityStatus === "ON_LEAVE"
                        ? "secondary"
                        : "destructive"
                  }
                  className="mt-0.5 text-[10px] px-1.5 py-0"
                >
                  {u.availabilityStatus?.replace("_", " ") ?? "ACTIVE"}
                </Badge>
                {u.availabilityStatus === "ON_LEAVE" && u.leaveTo && (
                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                    Till {formatDate(u.leaveTo)}
                  </span>
                )}
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-medium">Joined</span>
                <span className="text-muted-foreground">{u.joiningDate ? formatDate(u.joiningDate) : "—"}</span>
              </div>
            </div>

            {canManage && (
              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                <Link href={`/dashboard/employees/${u._id}`} className="flex-1 min-w-[100px]">
                  <Button variant="outline" size="sm" className="w-full text-xs h-9">
                    <Eye className="h-3.5 w-3.5 mr-1" /> View & Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 px-2.5"
                  onClick={() => onUpdateAvailability(u)}
                >
                  Availability
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title={u.isActive ? "Deactivate" : "Activate"}
                  onClick={() =>
                    toast.promise(setActive.mutateAsync({ id: u._id, isActive: !u.isActive }), {
                      loading: "Updating...",
                      success: `User ${u.isActive ? "deactivated" : "activated"}`,
                      error: "Failed to update user",
                    })
                  }
                >
                  {u.isActive ? <UserX className="h-4 w-4 text-warning" /> : <UserCheck className="h-4 w-4 text-success" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  title="WhatsApp number"
                  onClick={() => setContactUser(u)}
                >
                  <MessageCircle className="h-4 w-4 text-primary" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  title="Delete"
                  onClick={() => {
                    if (confirm(`Delete ${u.name}? This cannot be undone.`)) {
                      toast.promise(deleteUser.mutateAsync(u._id), {
                        loading: "Deleting...",
                        success: "User deleted",
                        error: "Failed to delete user",
                      });
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block">
        <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Availability</TableHead>
          {canManage && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u._id}>
            <TableCell className="font-medium">
              <Link
                href={`/dashboard/employees/${u._id}`}
                className="hover:text-primary hover:underline font-semibold"
              >
                {u.name}
              </Link>
              <div className="text-xs text-muted-foreground">{u.email}</div>
              {u.phone && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  {u.phone}
                  {u.whatsappOptIn === false && " (muted)"}
                </div>
              )}
            </TableCell>
            <TableCell>{u.department ?? "—"}</TableCell>
            <TableCell>{u.designation ?? "—"}</TableCell>
            <TableCell>
              <Badge variant="secondary">{u.role.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell>{u.joiningDate ? formatDate(u.joiningDate) : "—"}</TableCell>
            <TableCell>
              <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Active" : "Inactive"}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  u.availabilityStatus === "ACTIVE"
                    ? "success"
                    : u.availabilityStatus === "ON_LEAVE"
                      ? "secondary"
                      : "destructive"
                }
              >
                {u.availabilityStatus?.replace("_", " ") ?? "ACTIVE"}
              </Badge>

              {u.availabilityStatus === "ON_LEAVE" && u.leaveTo && (
                <div className="mt-1 text-xs text-muted-foreground">
                  Until {formatDate(u.leaveTo)}
                </div>
              )}
            </TableCell>
            {canManage && (
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/dashboard/employees/${u._id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View Details & Edit"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={u.isActive ? "Deactivate" : "Activate"}
                    onClick={() =>
                      toast.promise(setActive.mutateAsync({ id: u._id, isActive: !u.isActive }), {
                        loading: "Updating...",
                        success: `User ${u.isActive ? "deactivated" : "activated"}`,
                        error: "Failed to update user",
                      })
                    }
                  >
                    {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="WhatsApp number"
                    onClick={() => setContactUser(u)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateAvailability(u)}
                  >
                    Availability
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete"
                    onClick={() => {
                      if (confirm(`Delete ${u.name}? This cannot be undone.`)) {
                        toast.promise(deleteUser.mutateAsync(u._id), {
                          loading: "Deleting...",
                          success: "User deleted",
                          error: "Failed to delete user",
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
        </Table>
      </div>
      <EditContactDialog user={contactUser} onClose={() => setContactUser(null)} />
    </>
  );
}
