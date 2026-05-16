import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Routine } from '../../../routines/domain/routine.entity';
import { TrainingDay } from '../../../routines/domain/training-day.entity';
import { RoutineRepository } from '../../../routines/domain/routine.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { StartSessionUseCase } from '../../domain/use-cases/start-session.use-case';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionAlreadyInProgressError } from '../../domain/errors/session-already-in-progress.error';

@Component({
  selector: 'fg-training-home-page',
  standalone: true,
  providers: [
    StartSessionUseCase,
    GetActiveSessionUseCase,
  ],
  template: `
    <div class="training-home">
      <h1>Entrenamiento</h1>

      @if (activeRoutine()) {
        <div class="training-home__routine">
          <h2>{{ activeRoutine()!.name }}</h2>
          @if (activeRoutine()!.description) {
            <p>{{ activeRoutine()!.description }}</p>
          }

          <div class="training-home__days">
            @for (day of trainingDays(); track day.id) {
              <button
                type="button"
                class="training-home__day-btn"
                (click)="startSession(day)"
                [disabled]="loading()"
              >
                {{ day.name }}
                @if (day.label) {
                  <span class="training-home__day-label"> — {{ day.label }}</span>
                }
              </button>
            } @empty {
              <p>Sin días de entrenamiento. Configurá tu rutina primero.</p>
            }
          </div>
        </div>
      } @else {
        <div class="training-home__empty">
          <p>No tenés ninguna rutina activa.</p>
          <a routerLink="/routines">Configurar rutinas</a>
        </div>
      }

      @if (errorMessage()) {
        <p class="training-home__error" role="alert">{{ errorMessage() }}</p>
      }
    </div>
  `,
})
export class TrainingHomePage implements OnInit {
  private readonly routineRepo = inject(RoutineRepository);
  private readonly trainingDayRepo = inject(TrainingDayRepository);
  private readonly startSessionUseCase = inject(StartSessionUseCase);
  private readonly getActiveSessionUseCase = inject(GetActiveSessionUseCase);
  private readonly store = inject(TrainingSessionStore);
  private readonly router = inject(Router);

  readonly activeRoutine = signal<Routine | null>(null);
  readonly trainingDays = signal<TrainingDay[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    // Check if a session is already in progress — resume it
    const activeSession = await this.getActiveSessionUseCase.execute();
    if (activeSession) {
      await this.store.loadActive();
      void this.router.navigate(['/training/session']);
      return;
    }

    const routine = await this.routineRepo.getActive();
    this.activeRoutine.set(routine);

    if (routine) {
      const days = await this.trainingDayRepo.getByRoutineId(routine.id);
      this.trainingDays.set(days);
    }
  }

  async startSession(day: TrainingDay): Promise<void> {
    const routine = this.activeRoutine();
    if (!routine) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      await this.startSessionUseCase.execute({
        routineId: routine.id,
        dayId: day.id,
      });
      await this.store.loadActive();
      void this.router.navigate(['/training/session']);
    } catch (err) {
      if (err instanceof SessionAlreadyInProgressError) {
        // Resume existing session
        await this.store.loadActive();
        void this.router.navigate(['/training/session']);
      } else {
        this.errorMessage.set('No se pudo iniciar la sesión. Intentá de nuevo.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
