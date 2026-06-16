import { inject, Injectable } from '@angular/core';
import { SwUpdate, type VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs/operators';

import { ToastService } from '@core/shared/ui/toast/toast.service';

/**
 * PwaUpdateService — surfaces a "Hay una versión nueva → Actualizar" banner when
 * ngsw downloads a new app version, instead of silently waiting for the second
 * cold start to activate it (the behaviour that confused Luca in prod).
 *
 * Reacts to SwUpdate.versionUpdates (VERSION_READY) → persistent toast with an
 * "Actualizar" action that calls activateUpdate() and reloads.
 *
 * No-op when the service worker is disabled (dev / unsupported browsers).
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly toast = inject(ToastService);

  private prompted = false;

  start(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.promptUpdate());
  }

  private promptUpdate(): void {
    if (this.prompted) return;
    this.prompted = true;

    this.toast.show({
      title: 'Hay una versión nueva',
      body: 'Actualizá para usar la última versión.',
      kind: 'info',
      duration: 0,
      action: { label: 'Actualizar', handler: () => this.applyUpdate() },
    });
  }

  private async applyUpdate(): Promise<void> {
    await this.swUpdate.activateUpdate();
    this.reload();
  }

  /** Indirection so the reload is spy-able in tests (jsdom can't navigate). */
  private reload(): void {
    document.location.reload();
  }
}
