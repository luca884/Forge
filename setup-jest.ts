import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import 'fake-indexeddb/auto';

// fake-indexeddb requires structuredClone — polyfill for jsdom environments
// where it may be missing.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T;
}

setupZoneTestEnv();
