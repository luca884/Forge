import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { EventBus } from '@core/shared/events/event-bus';
import type { TrainingHistoryClearedEvent } from '@core/shared/events/training-history-cleared.event';
import { RouterLink } from '@angular/router';
import { FgIconComponent } from '@core/shared/ui';
import { SessionRepository } from '../../domain/session.repository';
import { DexieSessionRepository } from '../../data/dexie-session.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { DexieTrainingDayRepository } from '../../../routines/data/dexie-training-day.repository';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';

/**
 * Strip above the bottom nav that leads back to the session in progress from any tab.
 *
 * It lives in the shell, outside every feature route, so it provides its own repositories. The
 * layout mounts it again each time the bottom nav comes back (leaving the session, Hoy → another
 * tab), so reading the active session once on init is enough.
 */
@Component({
  selector: 'fg-active-session-bar',
  standalone: true,
  imports: [RouterLink, FgIconComponent],
  providers: [
    { provide: SessionRepository, useClass: DexieSessionRepository },
    { provide: TrainingDayRepository, useClass: DexieTrainingDayRepository },
    GetActiveSessionUseCase,
  ],
  template: `
    @if (dayName(); as name) {
      <a routerLink="/training/session"
         data-active-session-bar
         [attr.aria-label]="'Continuar entrenamiento en curso: ' + name"
         class="flex items-center gap-2 min-h-12 px-4 bg-accent-soft border-t border-accent text-ink no-underline">
        <span class="w-2 h-2 rounded-full bg-accent shrink-0" aria-hidden="true"></span>
        <span class="min-w-0 truncate text-[13px] leading-[18px]">
          <span class="t-micro text-accent-ink">En curso</span>
          <span class="text-ink-2"> · </span>
          <span class="font-semibold">{{ name }}</span>
        </span>
        <span class="ml-auto shrink-0 flex items-center gap-0.5 text-[13px] leading-[18px] font-semibold text-accent-ink">
          Continuar
          <fg-icon name="chevron-right" [size]="16" />
        </span>
      </a>
    }
  `,
})
export class ActiveSessionBarComponent implements OnInit {
  private readonly getActiveSession = inject(GetActiveSessionUseCase);
  private readonly trainingDays = inject(TrainingDayRepository);

  /** Name of the day being trained; null hides the bar (no session in progress). */
  readonly dayName = signal<string | null>(null);

  constructor() {
    // "Borrar historial" deletes the session in progress without navigating away.
    const unsubscribe = inject(EventBus).subscribe<TrainingHistoryClearedEvent>('TrainingHistoryCleared', () =>
      this.dayName.set(null),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const session = await this.getActiveSession.execute();
    if (!session) return;
    const day = await this.trainingDays.getById(session.dayId);
    this.dayName.set(day?.name ?? 'Entrenamiento');
  }
}
