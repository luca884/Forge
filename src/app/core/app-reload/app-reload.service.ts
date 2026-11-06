import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/**
 * Restarts the app from scratch. After the whole database is replaced (restoring a backup), every
 * in-memory cache — profile, stores, the shell's session bar — would show the old data; a reload is
 * the one way to drop them all.
 */
@Injectable({ providedIn: 'root' })
export class AppReloadService {
  private readonly document = inject(DOCUMENT);

  reload(): void {
    this.document.defaultView?.location.reload();
  }
}
