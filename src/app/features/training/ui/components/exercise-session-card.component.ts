import { Component, Input, Output, EventEmitter, input, signal, inject, computed } from '@angular/core';
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

@Component({
  selector: 'fg-exercise-session-card',
  standalone: true,
  imports: [SetLoggerComponent, DisplayWeightPipe, FgChipComponent, FgIconComponent],
  providers: [ProgressionTargetCalculator],
  template: `
    <div class="bg-forge-900 rounded-[14px] ring-1 ring-inset ring-white/6 overflow-hidden">
      <!-- Header -->
      <header class="p-4 flex justify-between items-center">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="t-h3 text-forge-100">{{ exercise.name }}</span>
            @if (isPR()) {
              <fg-chip size="sm" leadingIcon="flame">PR</fg-chip>
            }
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="t-caption text-forge-500 tabular-nums">{{ targetLabel() }}</span>
            <span class="w-[3px] h-[3px] rounded-full bg-forge-600" aria-hidden="true"></span>
            <span class="t-caption tabular-nums"
                  [class.text-accent-300]="allDone()"
                  [class.text-forge-300]="!allDone()">
              {{ loggedSets.length }}/{{ targetSets.length }} sets
            </span>
          </div>
        </div>
        <fg-icon name="chevron-down" [size]="18"
                 class="text-forge-600 transition-transform"
                 [class.rotate-180]="expanded()"></fg-icon>
      </header>

      <!-- Sets list (only when expanded) -->
      @if (expanded() && (loggedSets.length > 0 || pendingSlots().length > 0)) {
        <div class="border-t border-forge-800">
          <!-- Done sets — tap a row to edit/remove it inline -->
          @for (set of loggedSets; track set.id; let i = $index, last = $last) {
            @if (editingSetId() === set.id) {
              <!-- Inline editor: replaces the row with the set logger in edit mode -->
              <div class="px-3 py-3 border-b border-forge-800/50"
                   [class.border-b-0]="last && pendingSlots().length === 0">
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
              </div>
            } @else {
              <button type="button"
                      (click)="startEdit(set.id)"
                      aria-label="Editar set"
                      class="w-full text-left px-4 py-3 flex items-center gap-3 border-b border-forge-800/50"
                      [class.border-b-0]="last && pendingSlots().length === 0">
                <!-- Done indicator dot -->
                <div class="w-6 h-6 rounded-full bg-accent-500 text-white flex items-center justify-center flex-shrink-0">
                  <fg-icon name="check" [size]="12"></fg-icon>
                </div>
                <!-- Weight × reps -->
                <div class="flex-1 font-sans text-[15px] font-medium tabular-nums text-forge-200">
                  @switch (set.type) {
                    @case ('weight-reps') {
                      @if (exerciseWeightUnit() === 'plates') {
                        {{ set.weight.value }} placas × <span class="text-forge-100">{{ set.reps.value }}</span>
                      } @else {
                        {{ set.weight.value | displayWeight: unit() }} × <span class="text-forge-100">{{ set.reps.value }}</span>
                      }
                    }
                    @case ('bodyweight-reps') {
                      {{ set.reps.value }} reps
                      @if (set.extraWeight) {
                        (+ {{ set.extraWeight.value | displayWeight: unit() }})
                      }
                    }
                    @case ('time') {
                      {{ set.durationSec }}s
                    }
                    @case ('distance-time') {
                      {{ set.distanceKm }} km en {{ set.durationSec }}s
                    }
                  }
                </div>
                @if (meetsTarget(set)) {
                  <span class="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-semibold tracking-[0.02em] flex-shrink-0
                               bg-[rgb(var(--accent-rgb)_/_0.16)] text-accent-300 shadow-[inset_0_0_0_1px_rgb(var(--accent-rgb)_/_0.3)]">
                    <fg-icon name="target" [size]="11"></fg-icon>
                    ¡Objetivo cumplido!
                  </span>
                }
                @if (set.isPR) {
                  <fg-chip size="sm">PR</fg-chip>
                }
                <fg-icon name="edit" [size]="14" class="text-forge-600 flex-shrink-0"></fg-icon>
              </button>
            }
          }

          <!-- Pending slots -->
          @for (slot of pendingSlots(); track $index; let i = $index, last = $last) {
            <div class="px-4 py-3 flex items-center gap-3 border-b border-forge-800/50"
                 [class.border-b-0]="last">
              <!-- Pending indicator dot -->
              <div class="w-6 h-6 rounded-full bg-forge-850 ring-1 ring-inset ring-white/8 text-forge-600 flex items-center justify-center text-[11px] font-bold tabular-nums flex-shrink-0">
                {{ loggedSets.length + i + 1 }}
              </div>
              <div class="flex-1 text-[15px] text-forge-600 tabular-nums">{{ slot.label }}</div>
            </div>
          }
        </div>
      }

      <!-- Set logger — hidden once the exercise reached its target sets (no over-logging) -->
      @if (sessionId && !allDone()) {
        <fg-set-logger
          [trackingType]="exercise.trackingType"
          [sessionId]="sessionId"
          [exerciseId]="exercise.id"
          [targetSetIndex]="loggedSets.length"
          [prefillTarget]="nextTarget"
          [progressionTarget]="progressionTargetStr()"
          [weightUnit]="exerciseWeightUnit()"
          (setLogged)="onSetLogged($event)"
        ></fg-set-logger>
      }
    </div>
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

  /**
   * Doble-progresión target object (slice 1 + 2).
   * Null when no previous data or exercise type has no target.
   * The card formats it into the set-logger string AND evaluates meetsTarget()
   * per logged set to render the "¡Objetivo cumplido!" badge (slice 2).
   */
  readonly progressionTargetData = input<ProgressionTarget | null>(null);

  private readonly progressionCalculator = inject(ProgressionTargetCalculator);

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

  isPR(): boolean {
    return this.loggedSets.some((s) => s.isPR);
  }

  /**
   * Formats the progression target object into the set-logger string
   * "82.5kg × 8 (superá 80kg × 8)". Null when no target.
   * Reads the progressionTargetData signal, so it re-evaluates per CD pass.
   */
  progressionTargetStr(): string | null {
    const target = this.progressionTargetData();
    if (!target) return null;
    const goal = this.progressionCalculator.formatTarget(target);
    const prev = this.progressionCalculator.formatPreviousBest(target.previousBest);
    return `${goal} (superá ${prev})`;
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

  targetLabel(): string {
    const first = this.targetSets[0];
    if (!first) return '';
    if (first.type === 'weight-reps') {
      return `${this.targetSets.length}×${first.reps}${first.weightKg ? ' @' + first.weightKg + 'kg' : ''}`;
    }
    if (first.type === 'bodyweight-reps') {
      return `${this.targetSets.length}×${first.reps}`;
    }
    if (first.type === 'time') {
      return `${this.targetSets.length}×${first.durationSec}s`;
    }
    if (first.type === 'distance-time') {
      return `${this.targetSets.length}×${first.distanceKm}km`;
    }
    return '';
  }

  pendingSlots(): { label: string }[] {
    const remaining = Math.max(0, this.targetSets.length - this.loggedSets.length);
    return Array.from({ length: remaining }, (_, i) => ({
      label: `— · set ${this.loggedSets.length + i + 1} de ${this.targetSets.length}`,
    }));
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
}
