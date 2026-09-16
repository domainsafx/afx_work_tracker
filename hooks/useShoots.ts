"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { CreateShootLogInput, ReturnShootLogInput } from "@/lib/validations";
import type { IShootLog } from "@/types";

export function useShootLogs(scope: "mine" | "team" = "mine") {
  return useQuery({
    queryKey: ["shoots", scope],
    queryFn: () => apiClient.get<{ items: IShootLog[] }>(`/api/shoots?scope=${scope}`),
  });
}

/** Admin / Super Admin only — month view for the Shoots calendar. */
export function useShootCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ["shoots", "calendar", year, month],
    queryFn: () => apiClient.get<{ year: number; month: number; items: IShootLog[] }>(
      `/api/shoots/calendar?year=${year}&month=${month}`
    ),
  });
}

export function useCreateShootLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateShootLogInput) => apiClient.post("/api/shoots", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shoots"] }),
  });
}

export function useReturnShootLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReturnShootLogInput }) =>
      apiClient.patch(`/api/shoots/${id}/return`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shoots"] }),
  });
}
