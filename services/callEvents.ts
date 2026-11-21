import { EventEmitter } from "events";

/**
 * In-process event emitter for call notifications.
 * Enables real-time SSE streaming to avoid continuous database polling.
 */
class CallEventEmitter extends EventEmitter {}

export const callEvents = new CallEventEmitter();
callEvents.setMaxListeners(500);

export const CALL_EVENT_TYPES = {
  INCOMING_CALL: "incoming_call",
  CALL_STATE_CHANGED: "call_state_changed",
} as const;
