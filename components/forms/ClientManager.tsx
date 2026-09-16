"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { ClientForm } from "@/components/forms/ClientForm";
import { EditClientDialog } from "@/components/forms/EditClientDialog";
import { Pencil, ShieldCheck, Trash2 } from "lucide-react";
import type { IClient } from "@/types";

function LinkDot({ present, label }: { present: boolean; label: string }) {
  return (
    <span
      title={present ? `${label} link added` : `No ${label.toLowerCase()} link yet`}
      className={
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
        (present ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground")
      }
    >
      <span className={"h-1.5 w-1.5 rounded-full " + (present ? "bg-success" : "bg-muted-foreground/40")} />
      {label}
    </span>
  );
}

export function ClientManager({ onCreated }: { onCreated?: (id: string) => void }) {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  const { data, isLoading } = useClients();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const [editing, setEditing] = useState<IClient | null>(null);

  function toggleActive(id: string, isActive: boolean) {
    toast.promise(updateClient.mutateAsync({ id, input: { isActive: !isActive } }), {
      loading: "Updating...",
      success: !isActive ? "Client reactivated" : "Client archived",
      error: (err) => err?.message ?? "Failed to update",
    });
  }

  function remove(id: string) {
    toast.promise(deleteClient.mutateAsync(id), {
      loading: "Removing...",
      success: "Client removed",
      error: (err) => err?.message ?? "Failed to remove",
    });
  }

  return (
    <div className="space-y-5">
      <ClientForm onSuccess={onCreated} />

      <div className="space-y-2">
        <p className="text-sm font-medium">Clients</p>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        )}
        {!isLoading && (data?.items ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No clients added yet.</p>
        )}
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {(data?.items ?? []).map((client) => (
            <div key={client._id} className="space-y-1.5 rounded-lg border border-border px-2.5 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate font-medium">{client.name}</span>
                <Badge variant={client.isActive ? "success" : "secondary"}>{client.isActive ? "Active" : "Archived"}</Badge>
                <Button size="icon" variant="ghost" onClick={() => setEditing(client)} title="Edit client">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleActive(client._id, client.isActive)}>
                  {client.isActive ? "Archive" : "Reactivate"}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(client._id)} title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <LinkDot present={!!client.deckLink} label="Deck" />
                <LinkDot present={!!client.deliverablesLink} label="Deliverables" />
                <LinkDot present={!!client.contentLink} label="Content" />
                {isSuperAdmin && (
                  <span
                    title={client.mouLink ? "MOU link added" : "No MOU link yet"}
                    className={
                      "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
                      (client.mouLink ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")
                    }
                  >
                    <ShieldCheck className="h-2.5 w-2.5" />
                    MOU
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing && <EditClientDialog client={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
