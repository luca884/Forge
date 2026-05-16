import { Injectable, inject, signal } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';

@Injectable()
export class RestTimerService {
  private readonly eventBus = inject(EventBus);

  readonly remaining = signal<number | null>(null);
  readonly isRunning = signal<boolean>(false);

  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.eventBus.subscribe('WorkedSetLogged', () => {
      this.start(90);
    });
  }

  start(seconds: number): void {
    this.stop();
    this.remaining.set(seconds);
    this.isRunning.set(true);
    this.scheduleNext();
  }

  cancel(): void {
    this.stop();
    this.remaining.set(null);
    this.isRunning.set(false);
  }

  skip(): void {
    this.stop();
    this.remaining.set(null);
    this.isRunning.set(false);
  }

  private stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduleNext(): void {
    this.timerId = setTimeout(() => {
      const current = this.remaining();
      if (current === null) return;

      if (current <= 1) {
        this.remaining.set(null);
        this.isRunning.set(false);
        this.timerId = null;
      } else {
        this.remaining.set(current - 1);
        this.scheduleNext();
      }
    }, 1000);
  }
}
