import { Injectable, signal } from '@angular/core';

/**
 * Device preference, not user data: lives in localStorage, never in Dexie
 * (same rule as forge.appearance).
 */
export const REST_PREFERENCES_STORAGE_KEY = 'forge.rest';

/** Rest used when an exercise has no rest of its own and nothing is saved. */
export const DEFAULT_REST_SECONDS = 90;

const DEFAULT_ALERT_ON_END = true;

/**
 * RestPreferencesService — "Descanso por defecto" and "Aviso al terminar el
 * descanso" from Perfil. The rest timer reads both when a set is logged and
 * when the countdown ends.
 */
@Injectable({ providedIn: 'root' })
export class RestPreferencesService {
  private readonly stored = readStored();
  private readonly defaultSecondsState = signal<number>(
    isRestSeconds(this.stored['defaultSeconds']) ? this.stored['defaultSeconds'] : DEFAULT_REST_SECONDS,
  );
  private readonly alertOnEndState = signal<boolean>(
    typeof this.stored['alertOnEnd'] === 'boolean' ? this.stored['alertOnEnd'] : DEFAULT_ALERT_ON_END,
  );

  readonly defaultSeconds = this.defaultSecondsState.asReadonly();
  readonly alertOnEnd = this.alertOnEndState.asReadonly();

  /** Same rule as RestSeconds: a non-negative integer; 0 means no rest. Invalid values are ignored. */
  setDefaultSeconds(seconds: number): void {
    if (!isRestSeconds(seconds)) return;
    this.defaultSecondsState.set(seconds);
    this.persist({ defaultSeconds: seconds });
  }

  setAlertOnEnd(enabled: boolean): void {
    this.alertOnEndState.set(enabled);
    this.persist({ alertOnEnd: enabled });
  }

  /** Merges into the stored object so other keys under the same entry survive. */
  private persist(patch: Record<string, unknown>): void {
    try {
      localStorage.setItem(REST_PREFERENCES_STORAGE_KEY, JSON.stringify({ ...readStored(), ...patch }));
    } catch {
      // Private mode or quota: the choice still applies for this visit.
    }
  }
}

function readStored(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REST_PREFERENCES_STORAGE_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function isRestSeconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}
