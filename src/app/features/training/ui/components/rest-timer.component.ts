import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FgIconComponent } from '@core/shared/ui';
import { RestTimerService } from '../services/rest-timer.service';

/** Seconds added by the "+15s" button. */
const EXTRA_REST_SECONDS = 15;

@Component({
  selector: 'fg-rest-timer',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (timerService.remaining() !== null) {
      <!-- Cuaderno: píldora de descanso en acento suave, pegada bajo el encabezado -->
      <div class="bg-surface border-b border-line px-3 py-1.5">
        <div class="flex items-center gap-2 h-9 pl-3 pr-1 rounded-full bg-accent-soft text-accent-ink"
             role="timer"
             [attr.aria-label]="ariaLabel()">
          <fg-icon name="timer" [size]="16"></fg-icon>
          <span class="text-[13px] font-semibold">Descanso</span>
          <span class="font-mono tabular-nums text-[15px] font-medium">{{ remainingFormatted() }}</span>
          <span class="progress-bar flex-1 h-[3px] rounded-sm bg-accent/20 overflow-hidden" aria-hidden="true">
            <span class="progress-fill block h-[3px] bg-accent transition-[width] duration-500 ease-linear"
                  [style.width.%]="remainingPct()"></span>
          </span>
          <button type="button"
                  class="h-7 px-2.5 rounded-full border border-accent bg-surface text-accent-ink font-mono text-[12px] font-medium cursor-pointer"
                  (click)="onAddTime()"
                  aria-label="Sumar 15 segundos al descanso">
            +15s
          </button>
          <button type="button"
                  class="h-7 px-2.5 rounded-full text-ink-2 text-[12px] font-semibold cursor-pointer"
                  (click)="onSkip()"
                  aria-label="Saltar descanso">
            Saltar
          </button>
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

  /** Share of the rest still to go — the width of the pill's track fill. */
  readonly remainingPct = computed(() => 100 - this.progressPct());

  /** "Descanso restante 1 minuto 24 segundos" — spoken form of the countdown. */
  readonly ariaLabel = computed(() => {
    const r = this.timerService.remaining();
    if (r === null) return 'Descanso restante';
    const m = Math.floor(r / 60);
    const s = r % 60;
    const parts: string[] = [];
    if (m > 0) parts.push(`${m} ${m === 1 ? 'minuto' : 'minutos'}`);
    if (s > 0 || m === 0) parts.push(`${s} ${s === 1 ? 'segundo' : 'segundos'}`);
    return `Descanso restante ${parts.join(' ')}`;
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

  /** Adds 15 s to the running rest. Restarts the same worker countdown with the new total. */
  onAddTime(): void {
    const remaining = this.timerService.remaining();
    if (remaining === null) return;
    this.initialSeconds.update((init) => (init === null ? init : init + EXTRA_REST_SECONDS));
    this.timerService.start(remaining + EXTRA_REST_SECONDS);
  }
}
