import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { callEvents, CALL_EVENT_TYPES } from "@/services/callEvents";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) route for real-time call notifications.
 * Replaces aggressive 3s polling with instant push notifications when clients support SSE.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`));

      const onIncomingCall = (payload: {
        targetUserId: string;
        callId: string;
        callType: string;
        initiatorId: string;
      }) => {
        if (payload.targetUserId === userId) {
          controller.enqueue(
            encoder.encode(
              `event: incoming_call\ndata: ${JSON.stringify(payload)}\n\n`
            )
          );
        }
      };

      const onCallState = (payload: { callId: string; status: string }) => {
        controller.enqueue(
          encoder.encode(
            `event: call_state\ndata: ${JSON.stringify(payload)}\n\n`
          )
        );
      };

      callEvents.on(CALL_EVENT_TYPES.INCOMING_CALL, onIncomingCall);
      callEvents.on(CALL_EVENT_TYPES.CALL_STATE_CHANGED, onCallState);

      // Keep connection alive with heartbeat every 20 seconds
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 20_000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeatInterval);
        callEvents.off(CALL_EVENT_TYPES.INCOMING_CALL, onIncomingCall);
        callEvents.off(CALL_EVENT_TYPES.CALL_STATE_CHANGED, onCallState);
        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
