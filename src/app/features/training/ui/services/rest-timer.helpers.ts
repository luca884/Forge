/**
 * Pure helper functions for the RestTimer — testable without Worker.
 * No Angular imports, no side effects.
 */

export type WorkerInboundMessage =
  | { type: 'start'; payload: { seconds: number } }
  | { type: 'cancel' };

export type WorkerOutboundMessage =
  | { type: 'tick'; payload: { remaining: number } }
  | { type: 'done' };

export function buildWorkerStartPayload(seconds: number): Extract<WorkerInboundMessage, { type: 'start' }> {
  return { type: 'start', payload: { seconds } };
}

export function buildWorkerCancelPayload(): Extract<WorkerInboundMessage, { type: 'cancel' }> {
  return { type: 'cancel' };
}

/**
 * Formats a remaining-seconds count as "M:SS".
 * Examples: 90 → "1:30", 5 → "0:05", 0 → "0:00".
 */
export function formatRemainingSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${m}:${ss}`;
}
