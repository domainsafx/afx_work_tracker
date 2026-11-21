"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEquipmentCatalog, useUpdateEquipment, useDeleteEquipment } from "@/hooks/useEquipment";
import { EquipmentForm } from "@/components/forms/EquipmentForm";
import { Minus, Plus, Trash2 } from "lucide-react";

export function EquipmentCatalogManager() {
  const { data, isLoading } = useEquipmentCatalog(true);
  const updateEquipment = useUpdateEquipment();
  const deleteEquipment = useDeleteEquipment();

  function toggleActive(id: string, isActive: boolean) {
    toast.promise(updateEquipment.mutateAsync({ id, input: { isActive: !isActive } }), {
      loading: "Updating...",
      success: !isActive ? "Marked as active" : "Retired",
      error: (err) => err?.message ?? "Failed to update",
    });
  }

  function adjustQuantity(id: string, current: number, delta: number) {
    const next = Math.max(1, current + delta);
    updateEquipment.mutate({ id, input: { totalQuantity: next } });
  }

  function remove(id: string) {
    toast.promise(deleteEquipment.mutateAsync(id), {
      loading: "Removing...",
      success: "Removed from catalog",
      error: (err) => err?.message ?? "Failed to remove",
    });
  }

  return (
    <div className="space-y-5">
      <EquipmentForm />

      <div className="space-y-2">
        <p className="text-sm font-medium">Catalog</p>
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        )}
        {!isLoading && (data?.items ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No equipment added yet.</p>
        )}
        <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
          {(data?.items ?? []).map((item) => (
            <div
              key={item._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border p-3 text-sm bg-card"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{item.name}</span>
                  <Badge variant={item.isActive ? "success" : "secondary"} className="shrink-0 text-[10px] px-1.5 py-0">
                    {item.isActive ? "Active" : "Retired"}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.category}{item.code ? ` · ${item.code}` : ""}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/50">
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => adjustQuantity(item._id, item.totalQuantity, -1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-14 text-center text-xs font-medium">
                    {item.availableQuantity ?? item.totalQuantity}/{item.totalQuantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => adjustQuantity(item._id, item.totalQuantity, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => toggleActive(item._id, item.isActive)}
                  >
                    {item.isActive ? "Retire" : "Activate"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => remove(item._id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

