"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCreateClient } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck } from "lucide-react";

export function ClientForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

  const createClient = useCreateClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deckLink, setDeckLink] = useState("");
  const [deliverablesLink, setDeliverablesLink] = useState("");
  const [contentLink, setContentLink] = useState("");
  const [mouLink, setMouLink] = useState("");

  async function submit() {
    if (!name.trim()) {
      toast.error("Please provide a client name");
      return;
    }
    try {
      const client: any = await createClient.mutateAsync({
        name,
        description: description || undefined,
        deckLink: deckLink || undefined,
        deliverablesLink: deliverablesLink || undefined,
        contentLink: contentLink || undefined,
        ...(isSuperAdmin ? { mouLink: mouLink || undefined } : {}),
      });
      toast.success("Client added");
      setName("");
      setDescription("");
      setDeckLink("");
      setDeliverablesLink("");
      setContentLink("");
      setMouLink("");
      onSuccess?.(client._id);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add client");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Client name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Studios" />
      </div>
      <div className="space-y-2">
        <Label>Description (optional)</Label>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Any extra context about this client" />
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

      <Button onClick={submit} disabled={createClient.isPending} className="w-full">
        {createClient.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Add client
      </Button>
    </div>
  );
}
