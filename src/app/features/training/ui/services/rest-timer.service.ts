import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import type { WorkerInboundMessage, WorkerOutboundMessage } from './rest-timer.helpers';
import { createRestTimerWorker } from './rest-timer-worker.factory';

@Injectable()
export class RestTimerService implements OnDestroy {
  private readonly eventBus = inject(EventBus);
  private readonly notificationService = inject(NotificationPermissionService);

  readonly remaining = signal<number | null>(null);
  readonly isRunning = signal<boolean>(false);

  private worker: Worker | null = null;
  private audio: HTMLAudioElement | null = null;

  constructor() {
    this.eventBus.subscribe('WorkedSetLogged', () => {
      this.start(90);
    });
  }

  start(seconds: number): void {
    const worker = this.getOrCreateWorker();

    if (this.isRunning()) {
      worker.postMessage({ type: 'cancel' } satisfies WorkerInboundMessage);
    }

    this.remaining.set(seconds);
    this.isRunning.set(true);
    worker.postMessage({ type: 'start', payload: { seconds } } satisfies WorkerInboundMessage);
  }

  cancel(): void {
    if (this.worker !== null) {
      this.worker.postMessage({ type: 'cancel' } satisfies WorkerInboundMessage);
    }
    this.remaining.set(null);
    this.isRunning.set(false);
  }

  skip(): void {
    this.cancel();
  }

  ngOnDestroy(): void {
    if (this.worker !== null) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  private getOrCreateWorker(): Worker {
    if (this.worker === null) {
      this.worker = createRestTimerWorker();
      this.worker.onmessage = (event: MessageEvent<WorkerOutboundMessage>) => {
        this.handleWorkerMessage(event.data);
      };
    }
    return this.worker;
  }

  private handleWorkerMessage(msg: WorkerOutboundMessage): void {
    if (msg.type === 'tick') {
      this.remaining.set(msg.payload.remaining);
    } else if (msg.type === 'done') {
      this.remaining.set(null);
      this.isRunning.set(false);
      this.notificationService.showTimerDoneNotification();
      this.playSound();
    }
  }

  private playSound(): void {
    try {
      if (this.audio === null) {
        this.audio = new Audio('/sounds/beep.mp3');
      }
      void this.audio.play();
    } catch {
      // Silent fail — audio may not be available (iOS without gesture, test env, etc.)
    }
  }
}
