import { Component, inject } from '@angular/core';
import { RestTimerService } from '../services/rest-timer.service';

@Component({
  selector: 'fg-rest-timer',
  standalone: true,
  template: `
    @if (timerService.remaining() !== null) {
      <div class="rest-timer">
        <span class="rest-timer__label">Descanso</span>
        <span class="rest-timer__countdown">{{ formatRemaining(timerService.remaining()!) }}</span>
        <div class="rest-timer__actions">
          <button type="button" (click)="timerService.skip()">Saltar</button>
          <button type="button" (click)="timerService.cancel()">Cancelar</button>
        </div>
      </div>
    }
  `,
})
export class RestTimerComponent {
  readonly timerService = inject(RestTimerService);

  formatRemaining(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}
