"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useClients } from "@/hooks/useClients";
import { ClientTable } from "@/components/tables/ClientTable";
import { ClientForm } from "@/components/forms/ClientForm";
import { EditClientDialog } from "@/components/forms/EditClientDialog";
import { ClientDeliverablesDialog } from "@/components/modals/ClientDeliverablesDialog";

import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Plus, Search } from "lucide-react";
import { can } from "@/utils/permissions";
import type { IClient } from "@/types";

export default function ClientsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const manage = can(role, "MANAGE_CLIENTS");
  const isSuperAdmin = role === "SUPER_ADMIN";

  const [search, setSearch] = useState("");

  // Add Client Dialog
  const [open, setOpen] = useState(false);

  // Edit Client Dialog
  const [editing, setEditing] = useState<IClient | null>(null);

  // Deliverables Dialog
  const [deliverablesClient, setDeliverablesClient] = useState<IClient | null>(null);

  const { data, isLoading } = useClients();

  const clients = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Clients
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage clients, their reference links, and delivery schedules.
          </p>
        </div>

        {manage && (
          <Dialog
            open={open}
            onOpenChange={setOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add client
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Add client
                </DialogTitle>

                <DialogDescription>
                  Add a client to give them their own reference links and delivery calendar.
                </DialogDescription>
              </DialogHeader>

              <ClientForm
                onSuccess={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              className="pl-9"
              placeholder="Search by client name or description..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>
        </CardHeader>

        <CardContent>
          <ClientTable
            clients={clients}
            loading={isLoading}
            canManage={manage}
            isSuperAdmin={isSuperAdmin}
            onEdit={(client) => setEditing(client)}
            onDeliverables={(client) => setDeliverablesClient(client)}
          />
        </CardContent>
      </Card>

      {editing && (
        <EditClientDialog
          client={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deliverablesClient && (
        <ClientDeliverablesDialog
          client={deliverablesClient}
          canManage={manage}
          onClose={() => setDeliverablesClient(null)}
        />
      )}
    </div>
  );
}
