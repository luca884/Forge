import { Injectable, signal } from '@angular/core';

/**
 * NotificationPermissionService — wraps the Web Notification API.
 * Gracefully degrades on iOS Safari (where Notification may be unavailable).
 */
@Injectable({ providedIn: 'root' })
export class NotificationPermissionService {
  readonly supported = signal<boolean>('Notification' in window);

  readonly permission = signal<'granted' | 'denied' | 'default'>(
    'Notification' in window
      ? (Notification.permission as 'granted' | 'denied' | 'default')
      : 'default',
  );

  async request(): Promise<void> {
    if (!this.supported()) {
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
