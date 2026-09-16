"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DeliveryCalendar } from "@/components/dashboard/DeliveryCalendar";
import { useDeliveryEvents } from "@/hooks/useDeliveryEvents";
import type { IClient } from "@/types";

export function ClientDeliverablesDialog({
  client,
  canManage,
  onClose,
}: {
  client: IClient;
  canManage: boolean;
  onClose: () => void;
}) {
  const [anchor, setAnchor] = useState(new Date());
  const { data, isLoading } = useDeliveryEvents(client._id, anchor.getFullYear());

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Deliverables — {client.name}</DialogTitle>
          <DialogDescription>
            {canManage
              ? "View and manage content delivery dates for this client."
              : "Content delivery dates for this client."}
          </DialogDescription>
        </DialogHeader>

        <DeliveryCalendar
          clientId={client._id}
          client={client}
          events={data?.items ?? []}
          loading={isLoading}
          canManage={canManage}
          anchor={anchor}
          onAnchorChange={setAnchor}
        />
      </DialogContent>
    </Dialog>
  );
}
