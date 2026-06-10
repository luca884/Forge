import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import { WorkedSetLoggedEvent } from '../../domain/events/worked-set-logged.event';
import type { WorkerInboundMessage, WorkerOutboundMessage } from './rest-timer.helpers';
import { createRestTimerWorker } from './rest-timer-worker.factory';

export const DEFAULT_REST_SECONDS = 90;

@Injectable()
export class RestTimerService implements OnDestroy {
  private readonly eventBus = inject(EventBus);
  private readonly notificationService = inject(NotificationPermissionService);

  readonly remaining = signal<number | null>(null);
  readonly isRunning = signal<boolean>(false);

  private worker: Worker | null = null;
  private audio: HTMLAudioElement | null = null;
  private restPlan: ReadonlyMap<string, number> = new Map();

  constructor() {
    this.eventBus.subscribe<WorkedSetLoggedEvent>('WorkedSetLogged', (event) => {
      const seconds = this.restPlan.get(event.workedSet.exerciseId) ?? DEFAULT_REST_SECONDS;
      // restSeconds = 0 means no rest for this exercise — do not start the timer.
      if (seconds === 0) return;
      this.start(seconds);
    });
  }

  /** Sets the per-exercise rest plan. Call once after loading the training day. */
  setRestPlan(plan: ReadonlyMap<string, number>): void {
    this.restPlan = plan;
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
