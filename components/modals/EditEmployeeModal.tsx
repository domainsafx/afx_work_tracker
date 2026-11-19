"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useUpdateEmployee } from "@/hooks/useEmployees";
import { Loader2 } from "lucide-react";

export function EditEmployeeModal({
  user,
  open,
  onOpenChange,
}: {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role;
  const isSuperAdmin = currentRole === "SUPER_ADMIN";

  const updateEmployee = useUpdateEmployee(user?._id ?? "");

  const [firstName, setFirstName] = useState(user?.firstName ?? user?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(
    user?.lastName ?? user?.name?.split(" ").slice(1).join(" ") ?? ""
  );
  const [department, setDepartment] = useState(user?.department ?? "");
  const [designation, setDesignation] = useState(user?.designation ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn ?? true);
  const [role, setRole] = useState(user?.role ?? "EMPLOYEE");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [joiningDate, setJoiningDate] = useState(
    user?.joiningDate ? new Date(user.joiningDate).toISOString().split("T")[0] : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Both first name and last name are required");
      return;
    }

    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast.error("Use international phone format, e.g. +919876543210");
      return;
    }

    try {
      await updateEmployee.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
        phone: phone || undefined,
        whatsappOptIn,
        joiningDate: joiningDate || undefined,
        ...(isSuperAdmin ? { role: role as any, isActive } : {}),
      });

      toast.success("Employee details updated successfully");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update employee");
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Employee Details</DialogTitle>
          <DialogDescription>
            Update profile, role, department, and contact information for {user.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>First name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Company Email</Label>
            <Input value={user.email} disabled className="bg-muted text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering, Design, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Video Editor"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Joining date</Label>
              <Input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>

            {isSuperAdmin ? (
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user.role} disabled className="bg-muted text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>WhatsApp number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
            />
            <p className="text-xs text-muted-foreground">
              International format with country code (e.g. +919876543210).
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            Send task &amp; notification updates on WhatsApp
          </label>

          {isSuperAdmin && (
            <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
              <Label className="text-xs font-semibold">Account Status</Label>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                    className="accent-primary"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="isActive"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                    className="accent-primary"
                  />
                  <span className="text-destructive font-medium">Deactivated</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateEmployee.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateEmployee.isPending}>
              {updateEmployee.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
