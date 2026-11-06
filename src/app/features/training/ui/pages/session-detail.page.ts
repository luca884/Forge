import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FgIconComponent } from '@core/shared/ui';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { SessionRepository } from '../../domain/session.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { ExerciseRepository } from '../../../exercises/domain/exercise.repository';
import type { Exercise } from '../../../exercises/domain/exercise.entity';
import { CorrectPastSetUseCase } from '../../domain/use-cases/correct-past-set.use-case';
import type { Session } from '../../domain/session.entity';
import type { WorkedSet } from '../../domain/worked-set';
import { ExerciseSessionCardComponent } from '../components/exercise-session-card.component';

/** The sets of one exercise in the session. */
interface ExerciseBlock {
  readonly exercise: Exercise;
  /** Mutable type only because the card's `loggedSets` input is typed `WorkedSet[]`. */
  readonly sets: WorkedSet[];
}

/**
 * A finished session, opened from "Diario": its sets per exercise, each one editable or removable.
 * Corrections go through CorrectPastSetUseCase, which also rebuilds the exercise's records.
 */
@Component({
  selector: 'fg-session-detail-page',
  standalone: true,
  imports: [RouterLink, FgIconComponent, ExerciseSessionCardComponent],
  template: `
    <section class="bg-page text-ink flex flex-col gap-3 px-4 pt-1 pb-6">
      <a
        routerLink="/training"
        aria-label="Volver"
        class="self-start -ml-2 h-11 px-2 flex items-center gap-0.5 text-[15px] font-medium text-ink no-underline"
      >
        <fg-icon name="chevron-left" [size]="20"></fg-icon>
        <span>Hoy</span>
      </a>

      @if (loaded()) {
        @if (session(); as s) {
          <header class="flex flex-col gap-0.5">
            <h1 class="text-[30px] leading-9 font-bold tracking-[-0.03em] text-ink">{{ dayName() }}</h1>
            <span data-session-date class="text-[13px] leading-[18px] font-medium text-ink-2">{{ dateLabel(s) }}</span>
          </header>
          <p class="text-[13px] leading-[18px] text-ink-2">Tocá una serie para corregirla o borrarla.</p>

          @for (block of blocks(); track block.exercise.id) {
            <fg-exercise-session-card
              [exercise]="block.exercise"
              [targetSets]="[]"
              [loggedSets]="block.sets"
              [sessionId]="s.id"
              [unit]="unit()"
              [canLog]="false"
              (setEdited)="onSetEdited($event)"
              (setRemoved)="onSetRemoved($event)"
            ></fg-exercise-session-card>
          } @empty {
            <p class="text-[15px] leading-5 text-ink-2">Esta sesión no tiene series.</p>
          }
        } @else {
          <p class="text-[15px] leading-5 text-ink-2">No encontramos esta sesión.</p>
        }
      }
    </section>
  `,
})
export class SessionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessions = inject(SessionRepository);
  private readonly days = inject(TrainingDayRepository);
  private readonly exercises = inject(ExerciseRepository);
  private readonly correct = inject(CorrectPastSetUseCase);
  private readonly toast = inject(ToastService);
  private readonly userPrefs = inject(UserPreferencesService);

  readonly unit = this.userPrefs.unit;
  readonly loaded = signal(false);
  readonly session = signal<Session | null>(null);
  readonly dayName = signal('Sesión');
  readonly blocks = signal<readonly ExerciseBlock[]>([]);

  private readonly exerciseCache = new Map<string, Exercise | null>();

  ngOnInit(): void {
    void this.userPrefs.loadOnce();
    void this.load();
  }

  dateLabel(session: Session): string {
    return session.startedAt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  async onSetEdited(set: WorkedSet): Promise<void> {
    await this.apply(() => this.correct.edit(this.sessionId(), set), 'Serie corregida');
  }

  async onSetRemoved(setId: string): Promise<void> {
    await this.apply(() => this.correct.remove(this.sessionId(), setId), 'Serie borrada');
  }

  private sessionId(): string {
    return this.route.snapshot.paramMap.get('sessionId') ?? '';
  }

  private async apply(change: () => Promise<void>, done: string): Promise<void> {
    try {
      await change();
      this.toast.success(done);
      await this.loadSets();
    } catch (err) {
      this.toast.error('No se pudo guardar la corrección', err instanceof Error ? err.message : undefined);
    }
  }

  private async load(): Promise<void> {
    try {
      const session = await this.sessions.getById(this.sessionId());
      if (session?.status === 'in-progress') {
        // S4: the session in progress is corrected inside the session.
        await this.router.navigate(['/training/session'], { replaceUrl: true });
        return;
      }
      if (!session) return;
      const day = await this.days.getById(session.dayId);
      this.dayName.set(day?.name ?? 'Sesión');
      this.session.set(session);
      await this.loadSets();
    } finally {
      this.loaded.set(true);
    }
  }

  /** Groups the session's sets by exercise, in the order the exercises were first trained. */
  private async loadSets(): Promise<void> {
    const sets = [...(await this.sessions.getSetsForSession(this.sessionId()))].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const byExercise = new Map<string, WorkedSet[]>();
    for (const set of sets) byExercise.set(set.exerciseId, [...(byExercise.get(set.exerciseId) ?? []), set]);

    const blocks: ExerciseBlock[] = [];
    for (const [exerciseId, exerciseSets] of byExercise) {
      const exercise = await this.exercise(exerciseId);
      if (exercise) blocks.push({ exercise, sets: exerciseSets });
    }
    this.blocks.set(blocks);
  }

  private async exercise(id: string): Promise<Exercise | null> {
    if (!this.exerciseCache.has(id)) this.exerciseCache.set(id, await this.exercises.getById(id));
    return this.exerciseCache.get(id) ?? null;
  }
}
