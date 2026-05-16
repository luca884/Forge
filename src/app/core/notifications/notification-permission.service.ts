import { Injectable, signal } from '@angular/core';

/**
 * NotificationPermissionService — wraps the Web Notification API (D-30).
 * Gracefully degrades on iOS Safari (where Notification may be unavailable).
 * Full implementation: slice-3 P3.
 */
@Injectable({ providedIn: 'root' })
export class NotificationPermissionService {
  readonly permission = signal<'granted' | 'denied' | 'default'>(
    'Notification' in window
      ? (Notification.permission as 'granted' | 'denied' | 'default')
      : 'default',
  );

  async request(): Promise<void> {
    if (!('Notification' in window)) {
      this.permission.set('denied');
      return;
    }
    const result = await Notification.requestPermission();
    this.permission.set(result);
  }

  showTimerDoneNotification(): void {
    if (this.permission() !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.ready.then((reg) => {
      void reg.showNotification('¡Descanso terminado!', {
        icon: '/icons/icon-192.png',
      });
    });
  }
}
