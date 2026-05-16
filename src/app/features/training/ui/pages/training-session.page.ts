import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Exercise } from '../../../exercises/domain/exercise.entity';
import { ExerciseInDay } from '../../../routines/domain/training-day.entity';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import { LogSetUseCase, LogSetInput } from '../../domain/use-cases/log-set.use-case';
import { CompleteSessionUseCase } from '../../domain/use-cases/complete-session.use-case';
import { TrainingSessionStore } from '../services/training-session.store';
import { ExerciseSessionCardComponent } from '../components/exercise-session-card.component';
import { RestTimerComponent } from '../components/rest-timer.component';
import { PrCelebrationComponent } from '../components/pr-celebration.component';
import { WorkedSet } from '../../domain/worked-set';

interface ExerciseWithData {
  exercise: Exercise;
  exerciseInDay: ExerciseInDay;
}

@Component({
  selector: 'fg-training-session-page',
  standalone: true,
  imports: [
    ExerciseSessionCardComponent,
    RestTimerComponent,
    PrCelebrationComponent,
  ],
  providers: [
    LogSetUseCase,
    CompleteSessionUseCase,
  ],
  template: `
    <div class="training-session">
      <header class="training-session__header">
        <h1>Sesión de entrenamiento</h1>
        @if (store.activeSession()) {
          <p class="training-session__date">{{ store.activeSession()!.date }}</p>
        }
      </header>

      <div class="training-session__exercises">
        @for (item of exercisesWithData(); track item.exercise.id) {
          <fg-exercise-session-card
            [exercise]="item.exercise"
            [targetSets]="item.exerciseInDay.targetSets"
            [loggedSets]="store.setsByExercise().get(item.exercise.id) ?? []"
            [sessionId]="store.activeSession()?.id ?? ''"
            (setLogged)="onSetLogged($event)"
          />
        } @empty {
          <p>No hay ejercicios en este día de entrenamiento.</p>
        }
      </div>

      <footer class="training-session__footer">
        <fg-rest-timer />

        <button
          type="button"
          class="training-session__complete-btn"
          (click)="completeSession()"
          [disabled]="completing()"
        >
          {{ completing() ? 'Completando...' : 'Completar sesión' }}
        </button>
      </footer>
    </div>

    <fg-pr-celebration
      [visible]="prVisible()"
      [set]="latestPrSet()"
      (dismissed)="dismissPr()"
    />
  `,
})
export class TrainingSessionPage implements OnInit {
  readonly store = inject(TrainingSessionStore);
  private readonly trainingDayRepo = inject(TrainingDayRepository);
  private readonly exerciseRepo = inject(ExerciseRepository);
  private readonly logSetUseCase = inject(LogSetUseCase);
  private readonly completeSessionUseCase = inject(CompleteSessionUseCase);
  private readonly router = inject(Router);

  readonly exercisesWithData = signal<ExerciseWithData[]>([]);
  readonly completing = signal(false);
  readonly prVisible = signal(false);
  readonly latestPrSet = signal<WorkedSet | null>(null);

  async ngOnInit(): Promise<void> {
    if (!this.store.activeSession()) {
      await this.store.loadActive();
    }

    const session = this.store.activeSession();
    if (!session) {
      void this.router.navigate(['/training']);
      return;
    }

    await this.store.refreshSets();

    const day = await this.trainingDayRepo.getById(session.dayId);
    if (!day) return;

    const exercisesWithData: ExerciseWithData[] = [];
    for (const exInDay of day.exercises) {
      const exercise = await this.exerciseRepo.getById(exInDay.exerciseId);
      if (exercise) {
        exercisesWithData.push({ exercise, exerciseInDay: exInDay });
      }
    }
    this.exercisesWithData.set(exercisesWithData);
  }

  async onSetLogged(input: LogSetInput): Promise<void> {
    try {
      const set = await this.logSetUseCase.execute(input);
      if (set.isPR) {
        this.latestPrSet.set(set);
        this.prVisible.set(true);
      }
    } catch {
      // Error handling — in slice-1 we silently skip
    }
  }

  async completeSession(): Promise<void> {
    const session = this.store.activeSession();
    if (!session) return;

    this.completing.set(true);
    try {
      await this.completeSessionUseCase.execute({ sessionId: session.id });
      void this.router.navigate(['/training/session/summary']);
    } catch {
      this.completing.set(false);
    }
  }

  dismissPr(): void {
    this.prVisible.set(false);
    this.latestPrSet.set(null);
  }
}
