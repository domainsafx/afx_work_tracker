"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useUpdateClient } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, ShieldCheck } from "lucide-react";
import type { IClient } from "@/types";

export function EditClientDialog({ client, onClose }: { client: IClient; onClose: () => void }) {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  const updateClient = useUpdateClient();
  const [name, setName] = useState(client.name);
  const [description, setDescription] = useState(client.description ?? "");
  const [deckLink, setDeckLink] = useState(client.deckLink ?? "");
  const [deliverablesLink, setDeliverablesLink] = useState(client.deliverablesLink ?? "");
  const [contentLink, setContentLink] = useState(client.contentLink ?? "");
  const [mouLink, setMouLink] = useState(client.mouLink ?? "");

  async function submit() {
    if (!name.trim()) {
      toast.error("Please provide a client name");
      return;
    }
    try {
      await updateClient.mutateAsync({
        id: client._id,
        input: {
          name,
          description: description || undefined,
          deckLink: deckLink || undefined,
          deliverablesLink: deliverablesLink || undefined,
          contentLink: contentLink || undefined,
          ...(isSuperAdmin ? { mouLink: mouLink || undefined } : {}),
        },
      });
      toast.success("Client updated");
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update client");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {client.name}</DialogTitle>
          <DialogDescription>Update client details and reference links.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea rows={2} className="text-base sm:text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Deck link</Label>
              <Input value={deckLink} onChange={(e) => setDeckLink(e.target.value)} placeholder="Link to the pitch/creative deck" />
            </div>
            <div className="space-y-2">
              <Label>Deliverables link</Label>
              <Input value={deliverablesLink} onChange={(e) => setDeliverablesLink(e.target.value)} placeholder="Where finished work lives" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Content link</Label>
            <Input value={contentLink} onChange={(e) => setContentLink(e.target.value)} placeholder="Drive link (or any link) to raw/working content" />
          </div>

          {isSuperAdmin && (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Label className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                MOU link
                <span className="font-normal text-muted-foreground">(Super Admin only)</span>
              </Label>
              <Input value={mouLink} onChange={(e) => setMouLink(e.target.value)} placeholder="Link to the signed MOU / contract" />
            </div>
          )}

          <Button onClick={submit} disabled={updateClient.isPending} className="w-full h-10 sm:h-9 font-medium">
            {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
