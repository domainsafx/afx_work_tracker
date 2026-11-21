"use client";

import { toast } from "sonner";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDecideTransfer } from "@/hooks/useTransfers";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { Check, X } from "lucide-react";

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export function TransferRequestsTable({
  requests,
  loading,
  showActions = false,
}: {
  requests: any[];
  loading?: boolean;
  showActions?: boolean;
}) {
  const decide = useDecideTransfer();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
      </div>
    );
  }

  if (!requests.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No transfer requests to show.
      </div>
    );
  }

  function act(id: string, decision: "approve" | "reject") {
    toast.promise(decide.mutateAsync({ id, decision }), {
      loading: decision === "approve" ? "Approving..." : "Rejecting...",
      success: decision === "approve" ? "Transfer approved" : "Transfer rejected",
      error: (err) => err?.message ?? "Failed to update transfer request",
    });
  }

  return (
    <>
      {/* Mobile Card List (shown on < md screens) */}
      <div className="space-y-3 md:hidden">
        {requests.map((r: any) => (
          <div
            key={r._id}
            className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/tasks/${r.task?._id ?? r.task}`}
                  className="font-semibold text-base hover:text-primary hover:underline line-clamp-2"
                >
                  {r.task?.title ?? "Task"}
                </Link>
                <div className="mt-1 text-xs text-muted-foreground">
                  Requested {formatDateTime(r.requestedAt ?? r.createdAt)}
                </div>
              </div>
              <Badge variant={STATUS_TONE[r.status]} className="shrink-0">
                {r.status}
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs rounded-lg bg-secondary/30 p-2.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium text-right">
                  {r.requestedByName}{" "}
                  <span className="text-muted-foreground">({r.requestedByRole?.replace("_", " ")})</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer to:</span>
                <span className="font-medium text-right">{r.transferToName}</span>
              </div>
              {r.reason && (
                <div className="pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  <span className="italic">{r.reason}</span>
                </div>
              )}
            </div>

            {showActions && r.status === "PENDING" && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="h-9 flex-1"
                  onClick={() => act(r._id, "approve")}
                  disabled={decide.isPending}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 flex-1"
                  onClick={() => act(r._id, "reject")}
                  disabled={decide.isPending}
                >
                  <X className="mr-1.5 h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            )}

            {r.approvedByName && (
              <div className="text-xs text-muted-foreground text-right">
                {r.status === "APPROVED" ? "Approved" : "Rejected"} by {r.approvedByName}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View (shown on md+ screens) */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Requested by</TableHead>
              <TableHead>Transfer to</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r: any) => (
              <TableRow key={r._id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/tasks/${r.task?._id ?? r.task}`} className="hover:text-primary hover:underline">
                    {r.task?.title ?? "Task"}
                  </Link>
                </TableCell>
                <TableCell>{r.requestedByName} <span className="text-xs text-muted-foreground">({r.requestedByRole.replace("_", " ")})</span></TableCell>
                <TableCell>{r.transferToName}</TableCell>
                <TableCell className="max-w-64 truncate" title={r.reason}>{r.reason}</TableCell>
                <TableCell><Badge variant={STATUS_TONE[r.status]}>{r.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.requestedAt ?? r.createdAt)}</TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    {r.status === "PENDING" ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => act(r._id, "approve")} disabled={decide.isPending}>
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => act(r._id, "reject")} disabled={decide.isPending}>
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {r.approvedByName ? `${r.status === "APPROVED" ? "Approved" : "Rejected"} by ${r.approvedByName}` : "—"}
                      </span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
