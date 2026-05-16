import { Injectable, signal } from '@angular/core';

/**
 * PwaInstallService — wraps the beforeinstallprompt event (D-31).
 * Safe on platforms where the event never fires (Safari, iOS).
 * Full implementation: slice-3 P3.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  readonly canInstall = signal<boolean>(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    this.deferredPrompt = null;
    this.canInstall.set(false);
  }
}

// Browser-defined but not yet in all TS lib versions
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
