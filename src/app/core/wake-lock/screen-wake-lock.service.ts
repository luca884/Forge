import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { APPEARANCE_STORAGE_KEY } from '@core/appearance/appearance.service';

/** Device preference stored next to the theme and accent (AppearanceService keeps other keys on save). */
const KEEP_AWAKE_KEY = 'keepAwake';

interface WakeLockSentinelLike extends EventTarget {
  release(): Promise<void>;
}

interface WakeLockLike {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

/**
 * ScreenWakeLockService — "Pantalla siempre encendida · Durante la sesión".
 * The session page calls hold() while a session is open and release() when it
 * leaves. The lock is only requested when the option is on (off by default),
 * the browser supports it and the page is visible. Browsers free the lock when
 * the page is hidden, so it is requested again on visibilitychange.
 */
@Injectable({ providedIn: 'root' })
export class ScreenWakeLockService {
  private readonly document = inject(DOCUMENT);
  private readonly wakeLock = (this.document.defaultView?.navigator as { wakeLock?: WakeLockLike } | undefined)
    ?.wakeLock;

  readonly supported = this.wakeLock !== undefined;

  private readonly enabledState = signal<boolean>(readStored()[KEEP_AWAKE_KEY] === true);
  readonly enabled = this.enabledState.asReadonly();

  private held = false;
  private sentinel: WakeLockSentinelLike | null = null;
  private pending = false;

  constructor() {
    this.document.addEventListener('visibilitychange', () => this.sync());
  }

  setEnabled(enabled: boolean): void {
    this.enabledState.set(enabled);
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ ...readStored(), [KEEP_AWAKE_KEY]: enabled }));
    } catch {
      // Private mode or quota: the choice still applies for this visit.
    }
    this.sync();
  }

  /** A session is open: keep the screen on while the option allows it. */
  hold(): void {
    this.held = true;
    this.sync();
  }

  /** The session ended or was left: free the lock. */
  release(): void {
    this.held = false;
    this.sync();
  }

  private wanted(): boolean {
    return this.held && this.enabledState() && this.document.visibilityState === 'visible';
  }

  private sync(): void {
    if (this.wanted()) {
      this.acquire();
    } else if (this.sentinel !== null && (!this.held || !this.enabledState())) {
      const sentinel = this.sentinel;
      this.sentinel = null;
      sentinel.release().catch(() => undefined);
    }
  }

  private acquire(): void {
    if (this.wakeLock === undefined || this.sentinel !== null || this.pending) return;
    this.pending = true;
    this.wakeLock.request('screen').then(
      (sentinel) => {
        this.pending = false;
        // The session may have ended or the option changed while the request was in flight.
        if (!this.wanted()) {
          sentinel.release().catch(() => undefined);
          return;
        }
        this.sentinel = sentinel;
        sentinel.addEventListener('release', () => {
          if (this.sentinel === sentinel) this.sentinel = null;
        });
      },
      () => {
        // NotAllowedError (hidden page, battery saver): retried on the next foreground.
        this.pending = false;
      },
    );
  }
}

function readStored(): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
