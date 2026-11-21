"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { CallKind, ICall, ICallState } from "@/types";

const ACTIVE_TAB_POLL_MS = 5_000;
const BACKGROUND_TAB_POLL_MS = 30_000;
const CALL_STATE_POLL_MS = 2_500;

/**
 * Adaptive polling + SSE push notifications for incoming calls.
 * Drops from 3s fixed polling to 5s active / 30s background, with instant SSE delivery.
 */
export function useIncomingCalls() {
  const qc = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) return;

    try {
      const es = new EventSource("/api/calls/events");
      eventSourceRef.current = es;

      es.addEventListener("incoming_call", () => {
        qc.invalidateQueries({ queryKey: ["calls", "incoming"] });
      });

      es.addEventListener("call_state", () => {
        qc.invalidateQueries({ queryKey: ["calls", "incoming"] });
      });

      es.onerror = () => {
        // Close on error; the query will continue with adaptive polling
        es.close();
      };

      return () => {
        es.close();
      };
    } catch {
      // EventSource failed to initialize; adaptive polling serves as fallback
    }
  }, [qc]);

  return useQuery({
    queryKey: ["calls", "incoming"],
    queryFn: () => apiClient.get<{ items: (ICall & { caller: any })[] }>("/api/calls/incoming"),
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.hidden) {
        return BACKGROUND_TAB_POLL_MS;
      }
      return ACTIVE_TAB_POLL_MS;
    },
    refetchOnWindowFocus: true,
  });
}

export function useStartDirectCall() {
  return useMutation({
    mutationFn: (input: { targetUserId: string; callType: CallKind; conversationId?: string }) =>
      apiClient.post<ICall>("/api/calls", input),
  });
}

export function useAcceptCall() {
  return useMutation({
    mutationFn: (roomId: string) => apiClient.post<ICall>(`/api/calls/${roomId}/accept`, {}),
  });
}

export function useDeclineCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => apiClient.post<ICall>(`/api/calls/${roomId}/decline`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calls", "incoming"] }),
  });
}

export function useLeaveCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => apiClient.post<ICall>(`/api/calls/${roomId}/leave`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calls", "incoming"] }),
  });
}

/** Live state of a call room — who's in it, ringing, or has left. */
export function useCallState(roomId: string | null) {
  return useQuery({
    queryKey: ["calls", "state", roomId],
    queryFn: () => apiClient.get<ICallState>(`/api/calls/${roomId}`),
    enabled: !!roomId,
    refetchInterval: CALL_STATE_POLL_MS,
  });
}
