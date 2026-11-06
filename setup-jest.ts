import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import 'fake-indexeddb/auto';

// fake-indexeddb requires structuredClone — polyfill for jsdom environments
// where it may be missing. V8's serializer implements the structured clone algorithm, so stored
// rows keep their Date objects as in a real browser (a JSON round trip would turn them into strings).
if (typeof globalThis.structuredClone === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v8 = require('node:v8') as typeof import('node:v8');
  globalThis.structuredClone = <T>(obj: T): T => v8.deserialize(v8.serialize(obj)) as T;
}

setupZoneTestEnv();
