import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RestTimerService } from '../services/rest-timer.service';
import { FgIconComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-rest-timer',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .rest-timer-pinned {
      background: rgba(18, 16, 14, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgb(var(--forge-800));
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: var(--z-timer-pinned);
    }

    .dot-pulse {
      width: 8px;
      height: 8px;
      border-radius: 9999px;
      background: rgb(var(--accent-rgb));
      animation: forge-pulse 1.2s ease-in-out infinite;
    }

    .skip-btn {
      height: 32px;
      padding: 0 12px;
      border-radius: 8px;
      border: none;
      background: rgb(var(--forge-850));
      color: rgb(var(--forge-300));
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
      font-family: inherit;
    }

    .progress-bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 2px;
      background: rgb(var(--forge-800));
    }

    .progress-fill {
      height: 100%;
      background: rgb(var(--accent-rgb));
      transition: width 0.5s linear;
    }
  `],
  template: `
    @if (timerService.remaining() !== null) {
      <div class="rest-timer-pinned"
           role="status"
           aria-live="polite"
           aria-label="Timer de descanso">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <div class="dot-pulse"></div>
          <span class="t-caption text-forge-500">DESCANSO</span>
          <span class="text-[22px] font-semibold text-forge-50 font-mono tabular-nums tracking-[-0.02em]">
            {{ remainingFormatted() }}
          </span>
        </div>
        <button type="button"
                class="skip-btn"
                (click)="onSkip()"
                aria-label="Saltar descanso">
          Saltar
        </button>
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-fill" [style.width.%]="progressPct()"></div>
        </div>
      </div>
    }
  `,
})
export class RestTimerComponent {
  readonly timerService = inject(RestTimerService);

  // Captures the initial seconds when a new countdown starts.
  // The service does not expose `total`, so we derive it locally.
  private readonly initialSeconds = signal<number | null>(null);

  constructor() {
    effect(() => {
      const r = this.timerService.remaining();
      if (r !== null && this.initialSeconds() === null) {
        this.initialSeconds.set(r);
      }
      if (r === null) {
        this.initialSeconds.set(null);
      }
    });
  }

  readonly remainingFormatted = computed(() => {
    const r = this.timerService.remaining();
    if (r === null) return '0:00';
    const m = Math.floor(r / 60);
    const s = r % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  });

  readonly progressPct = computed(() => {
    const rem = this.timerService.remaining();
    const init = this.initialSeconds();
    if (rem === null || init === null || init === 0) return 0;
    return Math.max(0, Math.min(100, ((init - rem) / init) * 100));
  });

  /** Preserved from original component. */
  formatRemaining(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  onSkip(): void {
    this.timerService.skip();
  }
}
