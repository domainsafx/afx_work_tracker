"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Settings2, Presentation, PackageCheck, FolderOpen, ShieldCheck, ExternalLink } from "lucide-react";
import { DeliveryCalendar } from "@/components/dashboard/DeliveryCalendar";
import { useClients } from "@/hooks/useClients";
import { useDeliveryEvents } from "@/hooks/useDeliveryEvents";
import { can } from "@/utils/permissions";

function ClientLink({ href, label, icon: Icon }: { href?: string; label: string; icon: any }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

export default function DeliveriesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const manage = can(role, "MANAGE_CLIENTS");

  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const [clientId, setClientId] = useState<string>("");
  const [anchor, setAnchor] = useState(new Date());

  useEffect(() => {
    if (!clientId && clientsData?.items?.length) {
      setClientId(clientsData.items[0]._id);
    }
  }, [clientsData, clientId]);

  const { data: eventsData, isLoading: eventsLoading } = useDeliveryEvents(clientId, anchor.getFullYear());
  const selectedClient = clientsData?.items?.find((c) => c._id === clientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Delivery Calendar</h1>
          <p className="text-sm text-muted-foreground">Content delivery dates by client.</p>
        </div>
        {manage && (
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/clients">
              <Settings2 className="h-4 w-4" /> Manage clients
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-auto sm:min-w-56 space-y-2">
              <CardTitle>Select client</CardTitle>
              <Select value={clientId} onValueChange={setClientId} disabled={clientsLoading}>
                <SelectTrigger className="w-full sm:w-auto"><SelectValue placeholder="Choose a client" /></SelectTrigger>
                <SelectContent>
                  {(clientsData?.items ?? []).map((client) => (
                    <SelectItem key={client._id} value={client._id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedClient?.description && (
              <CardDescription className="max-w-sm">{selectedClient.description}</CardDescription>
            )}
          </div>
          {selectedClient && (
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <ClientLink href={selectedClient.deckLink} label="Deck" icon={Presentation} />
              <ClientLink href={selectedClient.deliverablesLink} label="Deliverables" icon={PackageCheck} />
              <ClientLink href={selectedClient.contentLink} label="Content" icon={FolderOpen} />
              {role === "SUPER_ADMIN" && <ClientLink href={selectedClient.mouLink} label="MOU" icon={ShieldCheck} />}
              {!selectedClient.deckLink && !selectedClient.deliverablesLink && !selectedClient.contentLink && (
                <p className="text-xs text-muted-foreground">
                  {manage ? "No reference links added yet — add them via Manage clients." : "No reference links added yet."}
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!clientsLoading && (clientsData?.items ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {manage ? "Add a client to start their delivery calendar." : "No clients have been set up yet."}
            </p>
          ) : clientId ? (
            <DeliveryCalendar
              clientId={clientId}
              client={selectedClient}
              events={eventsData?.items ?? []}
              loading={eventsLoading}
              canManage={manage}
              anchor={anchor}
              onAnchorChange={setAnchor}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
