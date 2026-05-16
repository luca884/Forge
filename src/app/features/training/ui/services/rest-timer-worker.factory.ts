/**
 * Factory that creates the RestTimer Web Worker.
 * Extracted into its own module so Jest tests can mock it
 * (import.meta.url is not supported in Jest CJS transform context).
 */
export function createRestTimerWorker(): Worker {
  return new Worker(
    new URL('./rest-timer.worker', import.meta.url),
    { type: 'module' },
  );
}
