/// <reference lib="webworker" />

import type { WorkerInboundMessage, WorkerOutboundMessage } from './rest-timer.helpers';

let intervalId: ReturnType<typeof setInterval> | null = null;
let remaining = 0;

addEventListener('message', (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;

  if (msg.type === 'start') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    remaining = msg.payload.seconds;

    intervalId = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(intervalId!);
        intervalId = null;
        const out: WorkerOutboundMessage = { type: 'done' };
        postMessage(out);
      } else {
        const out: WorkerOutboundMessage = { type: 'tick', payload: { remaining } };
        postMessage(out);
      }
    }, 1000);
  } else if (msg.type === 'cancel') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
});
