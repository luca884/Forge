import { Component, Input, Output, EventEmitter, input, signal, inject } from '@angular/core';
import { Exercise } from '../../../exercises/domain/exercise.entity';
import { TargetSet } from '../../../routines/domain/target-set';
import { WorkedSet } from '../../domain/worked-set';
import { SetLoggerComponent } from './set-logger.component';
import { LogSetInput } from '../../domain/use-cases/log-set.use-case';
import {
  ProgressionTargetCalculator,
  ProgressionTarget,
} from '../../domain/services/progression-target-calculator';
import { DisplayWeightPipe } from '@core/shared/ui/pipes/display-weight.pipe';
import { PreferredUnit } from '@features/profile/domain/value-objects/preferred-unit.vo';
import { FgChipComponent } from '@core/shared/ui/chip/chip.component';
import { FgIconComponent } from '@core/shared/ui';
import { formatPlates } from '../format-plates';

/** Two cells of a sheet row: the first holds the weight/distance/time, the second the reps/time. */
type RowCells = [string, string];

/** A planned series that has not been logged yet. */
interface PendingRow {
  readonly n: number;
  readonly prev: string;
  readonly cells: RowCells;
}

@Component({
  selector: 'fg-exercise-session-card',
  standalone: true,
  imports: [SetLoggerComponent, FgChipComponent, FgIconComponent],
  providers: [ProgressionTargetCalculator],
  template: `
    <!-- Cuaderno · planilla: encabezado del ejercicio, una fila por serie y la fila activa (logger) -->
    <section class="bg-surface border border-line rounded-lg overflow-hidden"
             [attr.aria-labelledby]="headingId()">
      <header class="px-3.5 pt-2.5 pb-1.5">
        <div class="flex items-center gap-2">
          <h2 [id]="headingId()" class="text-[17px] leading-[22px] font-semibold text-accent-ink min-w-0 truncate">{{ exercise.name }}</h2>
          @if (isPR()) {
            <fg-chip size="sm" leadingIcon="flame">PR</fg-chip>
          }
          <span data-set-counter
                class="ml-auto shrink-0 font-mono tabular-nums text-[12px] leading-4"
                [class.text-accent-ink]="allDone()"
                [class.text-ink-2]="!allDone()">{{ loggedSets.length }}/{{ targetSets.length }} series</span>
        </div>
        <p class="font-mono tabular-nums text-[12px] leading-4 text-ink-2">
          {{ targetLabel() }}
          @if (restLabel(); as rest) {
            · {{ rest }}
          }
        </p>
      </header>

      <!-- Sets list (only when expanded) -->
      @if (expanded() && (loggedSets.length > 0 || pendingSlots().length > 0)) {
        <div>
          <div data-sheet-head
               class="grid grid-cols-[40px_minmax(0,1fr)_76px_60px_44px] gap-x-1.5 items-center pl-3.5 pr-2 pb-1 t-micro text-ink-2">
            <span>Serie</span>
            <span>Anterior</span>
            <span class="text-center">{{ columns()[0] }}</span>
            <span class="text-center">{{ columns()[1] }}</span>
            <span class="text-center">Hecha</span>
          </div>

          <!-- Done sets — tap a row to edit/remove it inline -->
          @for (set of loggedSets; track set.id; let i = $index) {
            @if (editingSetId() === set.id) {
              <!-- Inline editor: replaces the row with the set logger in edit mode -->
              <fg-set-logger
                [trackingType]="exercise.trackingType"
                [sessionId]="sessionId"
                [exerciseId]="exercise.id"
                [editSet]="set"
                [weightUnit]="exerciseWeightUnit()"
                (setEdited)="onSetEdited($event)"
                (setRemoved)="onSetRemoved($event)"
                (editCancelled)="cancelEdit()"
              ></fg-set-logger>
            } @else {
              <button type="button"
                      (click)="startEdit(set.id)"
                      aria-label="Editar set"
                      class="w-full text-left grid grid-cols-[40px_minmax(0,1fr)_76px_60px_44px] gap-x-1.5 items-center min-h-11 pl-3.5 pr-2 bg-accent-soft border-t border-line-soft">
                <span data-cell="n" class="font-mono text-[14px] font-medium">{{ i + 1 }}</span>
                <span data-cell="prev" class="font-mono tabular-nums text-[13px] text-ink-2 truncate">{{ previousFor(i) }}</span>
                <span data-cell="a" class="font-mono tabular-nums text-[14px] font-medium text-center whitespace-nowrap">{{ setCells(set)[0] }}</span>
                <span data-cell="b" class="font-mono tabular-nums text-[14px] font-medium text-center">{{ setCells(set)[1] }}</span>
                <span class="justify-self-center w-9 h-9 rounded-lg bg-accent text-accent-on flex items-center justify-center">
                  <fg-icon name="check" [size]="18"></fg-icon>
                </span>
                @if (meetsTarget(set) || set.isPR) {
                  <span class="col-span-5 flex items-center gap-1.5 pb-2 pl-[46px]">
                    @if (meetsTarget(set)) {
                      <span class="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-semibold tracking-[0.02em] bg-surface border border-accent text-accent-ink">
                        <fg-icon name="target" [size]="11"></fg-icon>
                        ¡Objetivo cumplido!
                      </span>
                    }
                    @if (set.isPR) {
                      <fg-chip size="sm">PR</fg-chip>
                    }
                  </span>
                }
              </button>
            }
          }

          <!-- Pending slots: the planned target of each remaining series -->
          @for (slot of pendingSlots(); track slot.n; let first = $first) {
            <div data-pending-row
                 class="grid grid-cols-[40px_minmax(0,1fr)_76px_60px_44px] gap-x-1.5 items-center min-h-11 pl-3.5 pr-2 border-t border-line-soft"
                 [attr.aria-current]="first ? 'step' : null">
              <span data-cell="n" class="font-mono text-[14px] font-medium"
                    [class.text-accent-ink]="first">{{ slot.n }}</span>
              <span data-cell="prev" class="font-mono tabular-nums text-[13px] text-ink-2 truncate">{{ slot.prev }}</span>
              <span data-cell="a" class="font-mono tabular-nums text-[14px] text-ink-2 text-center whitespace-nowrap">{{ slot.cells[0] }}</span>
              <span data-cell="b" class="font-mono tabular-nums text-[14px] text-ink-2 text-center">{{ slot.cells[1] }}</span>
              <span class="justify-self-center w-9 h-9 rounded-lg border-[1.5px] border-dash bg-surface" aria-hidden="true"></span>
            </div>
          }
        </div>
      }

      @if (note(); as noteText) {
        <div class="flex items-center gap-2 px-3.5 py-2 border-t border-line-soft text-ink-2">
          <fg-icon name="edit" [size]="14"></fg-icon>
          <span class="text-[13px] leading-[18px]">{{ noteText }}</span>
        </div>
      }

      <!-- Set logger — hidden once the exercise reached its target sets (no over-logging) -->
      @if (sessionId && !allDone()) {
        <fg-set-logger
          [trackingType]="exercise.trackingType"
          [sessionId]="sessionId"
          [exerciseId]="exercise.id"
          [targetSetIndex]="loggedSets.length"
          [setNumber]="loggedSets.length + 1"
          [prefillTarget]="nextTarget"
          [previousSet]="previousSetForNextSlot()"
          [weightUnit]="exerciseWeightUnit()"
          (setLogged)="onSetLogged($event)"
        ></fg-set-logger>
      }
    </section>
  `,
})
export class ExerciseSessionCardComponent {
  @Input() exercise!: Exercise;
  @Input() targetSets: readonly TargetSet[] = [];
  @Input() loggedSets: WorkedSet[] = [];
  @Input() sessionId!: string;

  /** Preferred weight unit — passed down from the hosting page (D-2, ADR-22). */
  readonly unit = input<PreferredUnit>('kg');

  /** Whether the sets list is expanded. Default true for backward compat. */
  readonly expanded = input<boolean>(true);

  /** Rest between series, in seconds. The host resolves the default; 0 or undefined hides the label. */
  readonly restSeconds = input<number | undefined>(undefined);

  /** Free-form note of the exercise in the training day, shown under the sets. */
  readonly note = input<string | undefined>(undefined);

  /**
   * Doble-progresión target object.
   * Null when no previous data or exercise type has no target.
   * Only used to evaluate meetsTarget() per logged set and render the
   * "¡Objetivo cumplido!" badge — it is no longer shown as text in the logger.
   */
  readonly progressionTargetData = input<ProgressionTarget | null>(null);

  /**
   * Sets logged for this exercise in the previous session, ordered by slot.
   * Feeds the logger's prefill so each set input starts with what was actually
   * done last time in that same slot, and the "Anterior" column of the sheet.
   */
  readonly previousSessionSets = input<readonly WorkedSet[]>([]);

  private readonly progressionCalculator = inject(ProgressionTargetCalculator);
  private readonly weightPipe = new DisplayWeightPipe();

  @Output() setLogged = new EventEmitter<LogSetInput>();

  // ── Edit / remove past sets (slice 2) ──────────────────────────────────────
  /** Id of the set currently being edited inline, or null when none. */
  readonly editingSetId = signal<string | null>(null);

  @Output() setEdited = new EventEmitter<WorkedSet>();
  @Output() setRemoved = new EventEmitter<string>();

  // NOTE: these are plain methods (not computed()) on purpose — they derive from
  // @Input() properties, which are NOT signals. A computed() over non-signal reads
  // memoizes once and never recomputes, so it would go stale on a persistent card
  // (focused view). Methods re-evaluate every change-detection pass.

  /**
   * Returns the weightUnit from the exercise.
   * Plain method (NOT computed over @Input) so it re-evaluates on every CD pass
   * and stays correct as the focused exercise changes (see note on computed/@Input bug).
   */
  exerciseWeightUnit(): import('@core/shared/domain/weight-unit').WeightUnit {
    return this.exercise?.weightUnit ?? 'kg';
  }

  /** Id of the exercise heading, referenced by the section's aria-labelledby. */
  headingId(): string {
    return `exercise-title-${this.exercise?.id ?? ''}`;
  }

  isPR(): boolean {
    return this.loggedSets.some((s) => s.isPR);
  }

  /**
   * Set logged in the same slot during the previous session — the source of the
   * logger's prefill. Falls back to the last previous set when that session had
   * fewer sets than the current one. Null when there is no history.
   * Plain method (NOT computed over @Input) so it re-evaluates on every CD pass
   * as loggedSets grows (see note on the computed/@Input bug).
   */
  previousSetForNextSlot(): WorkedSet | null {
    const previous = this.previousSessionSets();
    if (previous.length === 0) return null;
    return previous[this.loggedSets.length] ?? previous.at(-1) ?? null;
  }

  /**
   * True when a logged set meets/exceeds the progression target (slice 2).
   * Plain method (NOT computed over @Input) so it re-evaluates on every CD pass
   * and stays correct as loggedSets changes on a persistent (focused) card.
   */
  meetsTarget(set: WorkedSet): boolean {
    return this.progressionCalculator.meetsTarget(set, this.progressionTargetData());
  }

  allDone(): boolean {
    return this.targetSets.length > 0 && this.loggedSets.length >= this.targetSets.length;
  }

  /** "Objetivo 4 × 6 · 100 kg" — the weight goes through the preferred unit. */
  targetLabel(): string {
    const first = this.targetSets[0];
    if (!first) return '';
    const n = this.targetSets.length;
    switch (first.type) {
      case 'weight-reps':
        return `Objetivo ${n} × ${first.reps}${first.weightKg ? ` · ${this.weight(first.weightKg)}` : ''}`;
      case 'bodyweight-reps':
        return `Objetivo ${n} × ${first.reps}${first.extraWeightKg ? ` · +${this.weight(first.extraWeightKg)}` : ''}`;
      case 'time':
        return `Objetivo ${n} × ${first.durationSec}s`;
      case 'distance-time':
        return `Objetivo ${n} × ${first.distanceKm} km`;
      default:
        return '';
    }
  }

  /** "descanso 2:00", or '' when the rest is unknown or disabled. */
  restLabel(): string {
    const seconds = this.restSeconds();
    if (!seconds) return '';
    return `descanso ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }

  /** Header labels of the two value columns, by tracking type. */
  columns(): [string, string] {
    switch (this.exercise?.trackingType) {
      case 'bodyweight-reps':
        return ['Extra', 'Reps'];
      case 'time':
        return ['Tiempo', ''];
      case 'distance-time':
        return ['Dist.', 'Tiempo'];
      default:
        return [this.exerciseWeightUnit() === 'plates' ? 'Placas' : 'Peso', 'Reps'];
    }
  }

  /** Cells of a logged series. */
  setCells(set: WorkedSet): RowCells {
    switch (set.type) {
      case 'weight-reps':
        return [this.weight(set.weight.value), `${set.reps.value}`];
      case 'bodyweight-reps':
        return [set.extraWeight ? `+${this.weight(set.extraWeight.value)}` : '—', `${set.reps.value}`];
      case 'time':
        return [`${set.durationSec}s`, ''];
      case 'distance-time':
        return [`${set.distanceKm} km`, `${set.durationSec}s`];
      default:
        return ['—', ''];
    }
  }

  /** Cells of a planned series (its target). */
  private targetCells(target: TargetSet | undefined): RowCells {
    if (!target) return ['—', '—'];
    switch (target.type) {
      case 'weight-reps':
        return [target.weightKg ? this.weight(target.weightKg) : '—', `${target.reps}`];
      case 'bodyweight-reps':
        return [target.extraWeightKg ? `+${this.weight(target.extraWeightKg)}` : '—', `${target.reps}`];
      case 'time':
        return [`${target.durationSec}s`, ''];
      case 'distance-time':
        return [`${target.distanceKm} km`, `${target.durationSec}s`];
      default:
        return ['—', ''];
    }
  }

  /** What was done in slot `index` last time, e.g. "20 kg × 8"; "—" without history. */
  previousFor(index: number): string {
    const previous = this.previousSessionSets()[index];
    if (!previous) return '—';
    const [a, b] = this.setCells(previous);
    if (previous.type === 'time') return a;
    if (previous.type === 'distance-time') return `${a} · ${b}`;
    return a === '—' ? `${b} reps` : `${a} × ${b}`;
  }

  pendingSlots(): PendingRow[] {
    const remaining = Math.max(0, this.targetSets.length - this.loggedSets.length);
    return Array.from({ length: remaining }, (_, i) => {
      const index = this.loggedSets.length + i;
      return { n: index + 1, prev: this.previousFor(index), cells: this.targetCells(this.targetSets[index]) };
    });
  }

  /** Target for the next set (indexed by loggedSets.length, fallback to last target). */
  get nextTarget(): TargetSet | null {
    return this.targetSets[this.loggedSets.length] ?? this.targetSets.at(-1) ?? null;
  }

  onSetLogged(input: LogSetInput): void {
    this.setLogged.emit(input);
  }

  /** Opens the inline editor for a logged set. */
  startEdit(setId: string): void {
    this.editingSetId.set(setId);
  }

  /** Closes the inline editor without changes. */
  cancelEdit(): void {
    this.editingSetId.set(null);
  }

  /** Re-emits the edited set upward and closes the editor. */
  onSetEdited(set: WorkedSet): void {
    this.editingSetId.set(null);
    this.setEdited.emit(set);
  }

  /** Re-emits the removed set id upward and closes the editor. */
  onSetRemoved(setId: string): void {
    this.editingSetId.set(null);
    this.setRemoved.emit(setId);
  }

  /** Weight for display: plates stay plates, everything else follows the preferred unit. */
  private weight(value: number): string {
    if (this.exerciseWeightUnit() === 'plates') return formatPlates(value);
    return this.weightPipe.transform(Math.round(value * 100) / 100, this.unit());
  }
}
