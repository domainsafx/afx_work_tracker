"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<{ items: any[] }>("/api/notifications"),
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.hidden) {
        return 60_000;
      }
      return 30_000;
    },
    refetchOnWindowFocus: true,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.patch("/api/notifications", { markAll: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
