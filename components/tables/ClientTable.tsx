"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  ShieldCheck,
  Presentation,
  FolderOpen,
  CalendarRange,
} from "lucide-react";
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

export function ClientTable({
  clients,
  loading,
  canManage,
  isSuperAdmin,
  onEdit,
  onDeliverables,
}: {
  clients: IClient[];
  loading?: boolean;
  canManage: boolean;
  isSuperAdmin: boolean;
  onEdit: (client: IClient) => void;
  onDeliverables: (client: IClient) => void;
}) {
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (!clients.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No clients found.
      </div>
    );
  }

  function toggleActive(client: IClient) {
    toast.promise(
      updateClient.mutateAsync({ id: client._id, input: { isActive: !client.isActive } }),
      {
        loading: "Updating...",
        success: client.isActive ? "Client archived" : "Client reactivated",
        error: (err) => err?.message ?? "Failed to update client",
      }
    );
  }

  function remove(client: IClient) {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    toast.promise(deleteClient.mutateAsync(client._id), {
      loading: "Removing...",
      success: "Client removed",
      error: (err) => err?.message ?? "Failed to remove client",
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Reference links</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added by</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client._id}>
            <TableCell className="font-medium">
              {client.name}
              {client.description && (
                <div className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                  {client.description}
                </div>
              )}
            </TableCell>
            <TableCell>
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
            </TableCell>
            <TableCell>
              <Badge variant={client.isActive ? "success" : "secondary"}>
                {client.isActive ? "Active" : "Archived"}
              </Badge>
              <div className="mt-1 text-xs text-muted-foreground">
                Since {formatDate(client.createdAt)}
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{client.createdByName}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Deliverables"
                  onClick={() => onDeliverables(client)}
                >
                  <CalendarRange className="h-4 w-4" />
                </Button>
                {client.deckLink && (
                  <Button variant="ghost" size="icon" title="Open deck" asChild>
                    <a href={client.deckLink} target="_blank" rel="noopener noreferrer">
                      <Presentation className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {client.contentLink && (
                  <Button variant="ghost" size="icon" title="Open content" asChild>
                    <a href={client.contentLink} target="_blank" rel="noopener noreferrer">
                      <FolderOpen className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {canManage && (
                  <>
                    <Button variant="ghost" size="icon" title="Edit client" onClick={() => onEdit(client)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(client)}>
                      {client.isActive ? "Archive" : "Reactivate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      onClick={() => remove(client)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
