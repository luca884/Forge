import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { WeightUnit } from '@core/shared/domain/weight-unit';
import { LogSetInput } from '../../domain/use-cases/log-set.use-case';
import { TargetSet } from '@features/routines/domain/target-set';
import { WorkedSet } from '../../domain/worked-set';
import { applySetEdit } from './set-edit.mapper';
import { FgButtonComponent } from '@core/shared/ui';
import { FgCardComponent } from '@core/shared/ui';
import { FgIconComponent } from '@core/shared/ui';
import { FgWheelPickerComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-set-logger',
  standalone: true,
  imports: [ReactiveFormsModule, FgButtonComponent, FgCardComponent, FgIconComponent, FgWheelPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .set-num {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: none;
      outline: none;
      text-align: center;
      color: rgb(var(--forge-50));
      font-weight: 600;
      font-size: 32px;
      line-height: 1;
      letter-spacing: -0.025em;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
    }
    .set-num::-webkit-outer-spin-button,
    .set-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  `],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <fg-card [padding]="16" class="ring-1 ring-inset ring-white/8">
        <header class="flex justify-between items-baseline mb-3">
          @if (isEditing()) {
            <span class="t-micro text-accent-300">EDITAR SET</span>
          } @else {
            <span class="t-micro text-forge-400">SET {{ setNumber() !== null ? setNumber() : '' }}</span>
            <span class="t-caption text-forge-300 tabular-nums">{{ targetLabel() }}</span>
          }
        </header>

        @switch (trackingType) {
          @case ('weight-reps') {
            <div class="grid grid-cols-2 gap-2.5 mb-3">
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                @if (weightUnit() === 'plates') {
                  <span class="t-caption text-forge-500">Placas</span>
                  <div class="flex items-baseline gap-1 w-full">
                    <input type="number" inputmode="numeric" step="1" min="1" formControlName="weightKg" aria-label="Placas" class="set-num" (focus)="onNumberFocus('weightKg')" (blur)="onNumberBlur('weightKg')" />
                    <span class="t-caption text-forge-600">placas</span>
                  </div>
                } @else {
                  <span class="t-caption text-forge-500">Peso</span>
                  <div class="flex items-baseline gap-1 w-full">
                    <input type="number" inputmode="decimal" step="0.5" min="0" formControlName="weightKg" aria-label="Peso en kg" class="set-num" (focus)="onNumberFocus('weightKg')" (blur)="onNumberBlur('weightKg')" />
                    <span class="t-caption text-forge-600">kg</span>
                  </div>
                }
              </label>
              <div class="bg-forge-900 rounded-xl py-2.5 px-2 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Reps</span>
                <fg-wheel-picker class="w-full" formControlName="reps" [min]="1" [max]="50" ariaLabel="Repeticiones" />
              </div>
            </div>
          }
          @case ('bodyweight-reps') {
            <div class="grid grid-cols-2 gap-2.5 mb-3">
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Extra (kg)</span>
                <div class="flex items-baseline gap-1 w-full">
                  <input type="number" inputmode="decimal" step="0.5" min="0" formControlName="extraWeightKg" aria-label="Peso extra en kg" class="set-num" placeholder="0" />
                  <span class="t-caption text-forge-600">kg</span>
                </div>
              </label>
              <div class="bg-forge-900 rounded-xl py-2.5 px-2 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Reps</span>
                <fg-wheel-picker class="w-full" formControlName="reps" [min]="1" [max]="50" ariaLabel="Repeticiones" />
              </div>
            </div>
          }
          @case ('time') {
            <div class="grid grid-cols-1 gap-2.5 mb-3">
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Duración</span>
                <div class="flex items-baseline gap-1 w-full justify-center">
                  <input type="number" inputmode="numeric" step="5" min="0" formControlName="durationSec" aria-label="Duración en segundos" class="set-num" (focus)="onNumberFocus('durationSec')" (blur)="onNumberBlur('durationSec')" />
                  <span class="t-caption text-forge-600">seg</span>
                </div>
              </label>
            </div>
          }
          @case ('distance-time') {
            <div class="grid grid-cols-2 gap-2.5 mb-3">
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Distancia</span>
                <div class="flex items-baseline gap-1 w-full">
                  <input type="number" inputmode="decimal" step="0.1" min="0" formControlName="distanceKm" aria-label="Distancia en km" class="set-num" (focus)="onNumberFocus('distanceKm')" (blur)="onNumberBlur('distanceKm')" />
                  <span class="t-caption text-forge-600">km</span>
                </div>
              </label>
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Duración</span>
                <div class="flex items-baseline gap-1 w-full">
                  <input type="number" inputmode="numeric" step="5" min="0" formControlName="durationSec" aria-label="Duración en segundos" class="set-num" (focus)="onNumberFocus('durationSec')" (blur)="onNumberBlur('durationSec')" />
                  <span class="t-caption text-forge-600">seg</span>
                </div>
              </label>
            </div>
          }
        }

        @if (lastSet() && !isEditing()) {
          <div class="t-body-sm text-forge-500 mb-2.5 flex items-center gap-1.5">
            <fg-icon name="history" [size]="12"></fg-icon>
            <span class="tabular-nums">{{ lastSet() }}</span>
          </div>
        }
        @if (isEditing()) {
          <button fg-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [full]="true"
                  leadingIcon="check"
                  [disabled]="form.invalid">
            Guardar cambios
          </button>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <button fg-button
                    type="button"
                    variant="ghost"
                    size="md"
                    (click)="onCancel()"
                    aria-label="Cancelar edición">
              Cancelar
            </button>
            <button fg-button
                    type="button"
                    variant="destructive"
                    size="md"
                    leadingIcon="trash"
                    (click)="onRemove()"
                    aria-label="Borrar set">
              Borrar
            </button>
          </div>
        } @else {
          <button fg-button
                  type="submit"
                  [variant]="state() === 'logged' ? 'accent_soft' : 'primary'"
                  size="lg"
                  [full]="true"
                  leadingIcon="check"
                  [disabled]="form.invalid">
            {{ state() === 'logged' ? 'Set logueado · descanso 1:30' : 'Loguear set' }}
          </button>
        }
      </fg-card>
    </form>
  `,
})
export class SetLoggerComponent implements OnInit {
  // ── Preserved @Input / @Output (API contract — CC-5) ──────────────────────
  @Input() trackingType: TrackingType = 'weight-reps';
  @Input() sessionId!: string;
  @Input() exerciseId!: string;
  @Input() targetSetIndex?: number;
  @Input() prefillWeightKg?: number;
  @Input() prefillReps?: number;

  @Output() readonly setLogged = new EventEmitter<LogSetInput>();

  // ── Edit mode (slice 2: editar/borrar sets pasados) ────────────────────────
  /** When set, the logger renders in edit mode for this existing WorkedSet. */
  readonly editSet = input<WorkedSet | null>(null);
  readonly isEditing = computed(() => this.editSet() !== null);

  @Output() readonly setEdited = new EventEmitter<WorkedSet>();
  @Output() readonly setRemoved = new EventEmitter<string>();
  @Output() readonly editCancelled = new EventEmitter<void>();

  // ── Additive optional signal inputs (D-1 redesign, not breaking consumers) ─
  readonly setNumber = input<number | null>(null);
  readonly targetLabel = input<string>('');
  readonly lastSet = input<string | null>(null);
  readonly state = input<'idle' | 'logged'>('idle');
  /** Additive prefill via TargetSet (CC-5: legacy prefillWeightKg/prefillReps remain as fallback). */
  readonly prefillTarget = input<TargetSet | null>(null);
  /**
   * Set logged in this same slot the last time the exercise was trained.
   * Takes precedence over prefillTarget: the inputs show what was actually done
   * last time, so the user only edits the numbers they want to change.
   * Null → no history for this slot, fall back to the routine plan target.
   */
  readonly previousSet = input<WorkedSet | null>(null);

  /**
   * Unit of measurement for weight-reps exercises (Slice A — plates feature).
   * 'kg'     → standard decimal input (step 0.5, min 0.1).
   * 'plates' → integer input (step 1, min 1, label "placas").
   * Signal input — avoids the computed()-over-@Input reactiviy bug.
   */
  readonly weightUnit = input<WeightUnit>('kg');

  private readonly fb = inject(FormBuilder);

  /** Id of the previousSet whose values are currently in the form — detects slot changes. */
  private appliedPreviousSetId: string | null = null;

  readonly form = this.fb.group({
    reps: [0, [Validators.min(0)]],
    weightKg: [0, [Validators.min(0.1)]],
    extraWeightKg: [null as number | null],
    durationSec: [0, [Validators.min(0)]],
    distanceKm: [0, [Validators.min(0)]],
    note: [''],
  });

  constructor() {
    // Prefill (logging mode): last time's set when available, else the plan
    // target. Skipped while editing an existing set.
    //
    // A NEW previousSet means the user moved to another set slot or another
    // exercise, so whatever was typed for the previous slot must not leak into
    // this one — the form is reset outright. A plain prefillTarget change keeps
    // the historical guard: a dirty form is never overwritten.
    effect(() => {
      const previousSetId = this.previousSet()?.id ?? null;
      const patch = this.prefillPatch();
      if (this.editSet()) return;

      const slotChanged = previousSetId !== this.appliedPreviousSetId;
      this.appliedPreviousSetId = previousSetId;

      if (slotChanged && previousSetId !== null) {
        this.form.reset({ ...this.defaultFormValue(), ...patch });
        return;
      }
      if (this.form.pristine) {
        this.form.patchValue(patch);
      }
    });

    // Prefill from the existing set (edit mode).
    effect(() => {
      const set = this.editSet();
      if (set && this.form.pristine) {
        this.form.patchValue(this.setFormPatch(set));
      }
    });
  }

  ngOnInit(): void {
    // weightKg's min(0.1) only makes sense for weight-reps/kg. For other
    // tracking types the field is unused but would keep the form permanently
    // invalid (weightKg=0 < 0.1) and block the submit button. Drop it.
    // For 'plates', enforce min(1) integer instead of min(0.1) decimal.
    if (this.trackingType !== 'weight-reps') {
      this.form.controls.weightKg.clearValidators();
      this.form.controls.weightKg.updateValueAndValidity();
    } else if (this.weightUnit() === 'plates') {
      this.form.controls.weightKg.setValidators([Validators.min(1)]);
      this.form.controls.weightKg.updateValueAndValidity();
    }

    // Legacy fallback: prefillWeightKg / prefillReps (CC-5 contract).
    // Only applied when neither previousSet nor prefillTarget is set.
    if (this.prefillTarget() === null && this.previousSet() === null) {
      if (this.prefillWeightKg !== undefined) {
        this.form.patchValue({ weightKg: this.prefillWeightKg });
      }
      if (this.prefillReps !== undefined) {
        this.form.patchValue({ reps: this.prefillReps });
      }
    }
  }

  /** Clears the field when it still holds the default 0, so the user types over a blank. */
  onNumberFocus(control: 'weightKg' | 'durationSec' | 'distanceKm'): void {
    const c = this.form.controls[control];
    if (c.value === 0) c.setValue(null);
  }

  /** Restores 0 when the field is left empty, keeping the form state defined. */
  onNumberBlur(control: 'weightKg' | 'durationSec' | 'distanceKm'): void {
    const c = this.form.controls[control];
    if (c.value === null || c.value === undefined) c.setValue(0);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    // Edit mode: emit the updated WorkedSet, do NOT log a new set.
    const editing = this.editSet();
    if (editing) {
      this.setEdited.emit(
        applySetEdit(editing, {
          reps: value.reps,
          weightKg: value.weightKg,
          extraWeightKg: value.extraWeightKg,
          durationSec: value.durationSec,
          distanceKm: value.distanceKm,
        }),
      );
      return;
    }

    const logInput: LogSetInput = {
      sessionId: this.sessionId,
      exerciseId: this.exerciseId,
      targetSetIndex: this.targetSetIndex,
      type: this.trackingType,
      repsValue: value.reps ?? undefined,
      weightKgValue: value.weightKg ?? undefined,
      extraWeightKgValue: value.extraWeightKg ?? undefined,
      durationSecValue: value.durationSec ?? undefined,
      distanceKmValue: value.distanceKm ?? undefined,
      note: value.note || undefined,
    };

    this.setLogged.emit(logInput);
    this.form.reset(this.defaultFormValue());
  }

  /** Edit mode: removes the set being edited. */
  onRemove(): void {
    const editing = this.editSet();
    if (editing) this.setRemoved.emit(editing.id);
  }

  /** Edit mode: discards changes and closes the editor. */
  onCancel(): void {
    this.editCancelled.emit();
  }

  /** Maps a WorkedSet to form values — used for edit mode and last-time prefill. */
  private setFormPatch(set: WorkedSet): Partial<{
    reps: number;
    weightKg: number;
    extraWeightKg: number | null;
    durationSec: number;
    distanceKm: number;
  }> {
    switch (set.type) {
      case 'weight-reps':
        return { reps: set.reps.value, weightKg: set.weight.value };
      case 'bodyweight-reps':
        return { reps: set.reps.value, extraWeightKg: set.extraWeight?.value ?? null };
      case 'time':
        return { durationSec: set.durationSec };
      case 'distance-time':
        return { distanceKm: set.distanceKm, durationSec: set.durationSec };
    }
  }

  /**
   * Values the inputs start with: what was done in this slot last time when
   * there is history, otherwise the routine plan target.
   */
  private prefillPatch(): Partial<{
    reps: number;
    weightKg: number;
    extraWeightKg: number | null;
    durationSec: number;
    distanceKm: number;
  }> {
    const previous = this.previousSet();
    if (previous) return this.setFormPatch(previous);
    return this.targetFormPatch(this.prefillTarget());
  }

  /** Returns form reset values derived from the prefill source (or legacy scalars, or 0). */
  private defaultFormValue(): {
    reps: number;
    weightKg: number;
    extraWeightKg: number | null;
    durationSec: number;
    distanceKm: number;
    note: string;
  } {
    const patch = this.prefillPatch();
    return {
      reps: patch.reps ?? this.prefillReps ?? 0,
      weightKg: patch.weightKg ?? this.prefillWeightKg ?? 0,
      extraWeightKg: patch.extraWeightKg ?? null,
      durationSec: patch.durationSec ?? 0,
      distanceKm: patch.distanceKm ?? 0,
      note: '',
    };
  }

  /** Maps a TargetSet to partial form values. Returns empty object for unhandled types. */
  private targetFormPatch(target: TargetSet | null): Partial<{
    reps: number;
    weightKg: number;
    extraWeightKg: number | null;
  }> {
    if (!target) return {};
    if (target.type === 'weight-reps') {
      return { weightKg: target.weightKg ?? this.prefillWeightKg ?? 0, reps: target.reps };
    }
    if (target.type === 'bodyweight-reps') {
      return { extraWeightKg: target.extraWeightKg ?? null, reps: target.reps };
    }
    // 'time' | 'distance-time' — not prefilled
    return {};
  }
}
