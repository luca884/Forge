import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  effect,
  inject,
  input,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { LogSetInput } from '../../domain/use-cases/log-set.use-case';
import { TargetSet } from '@features/routines/domain/target-set';
import { FgButtonComponent } from '@core/shared/ui';
import { FgCardComponent } from '@core/shared/ui';
import { FgIconComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-set-logger',
  standalone: true,
  imports: [ReactiveFormsModule, FgButtonComponent, FgCardComponent, FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .set-num, .set-select {
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
    .set-select { text-align-last: center; }
  `],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <fg-card [padding]="16" class="ring-1 ring-inset ring-white/8">
        <header class="flex justify-between items-baseline mb-3">
          <span class="t-micro text-forge-400">SET {{ setNumber() !== null ? setNumber() : '' }} · OBJETIVO</span>
          <span class="t-caption text-forge-300 tabular-nums">{{ targetLabel() }}</span>
        </header>

        @switch (trackingType) {
          @case ('weight-reps') {
            <div class="grid grid-cols-2 gap-2.5 mb-3">
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Peso</span>
                <div class="flex items-baseline gap-1 w-full">
                  <input type="number" inputmode="decimal" step="0.5" min="0" formControlName="weightKg" aria-label="Peso en kg" class="set-num" />
                  <span class="t-caption text-forge-600">kg</span>
                </div>
              </label>
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Reps</span>
                <select formControlName="reps" aria-label="Repeticiones" class="set-select">
                  <option [ngValue]="0" disabled>—</option>
                  @for (r of repsOptions; track r) { <option [ngValue]="r">{{ r }}</option> }
                </select>
              </label>
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
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Reps</span>
                <select formControlName="reps" aria-label="Repeticiones" class="set-select">
                  <option [ngValue]="0" disabled>—</option>
                  @for (r of repsOptions; track r) { <option [ngValue]="r">{{ r }}</option> }
                </select>
              </label>
            </div>
          }
          @case ('time') {
            <div class="grid grid-cols-1 gap-2.5 mb-3">
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Duración</span>
                <div class="flex items-baseline gap-1 w-full justify-center">
                  <input type="number" inputmode="numeric" step="5" min="0" formControlName="durationSec" aria-label="Duración en segundos" class="set-num" />
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
                  <input type="number" inputmode="decimal" step="0.1" min="0" formControlName="distanceKm" aria-label="Distancia en km" class="set-num" />
                  <span class="t-caption text-forge-600">km</span>
                </div>
              </label>
              <label class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Duración</span>
                <div class="flex items-baseline gap-1 w-full">
                  <input type="number" inputmode="numeric" step="5" min="0" formControlName="durationSec" aria-label="Duración en segundos" class="set-num" />
                  <span class="t-caption text-forge-600">seg</span>
                </div>
              </label>
            </div>
          }
        }

        @if (lastSet()) {
          <div class="t-body-sm text-forge-500 mb-2.5 flex items-center gap-1.5">
            <fg-icon name="history" [size]="12"></fg-icon>
            <span class="tabular-nums">{{ lastSet() }}</span>
          </div>
        }

        <button fg-button
                type="submit"
                [variant]="state() === 'logged' ? 'accent_soft' : 'primary'"
                size="lg"
                [full]="true"
                leadingIcon="check"
                [disabled]="form.invalid">
          {{ state() === 'logged' ? 'Set logueado · descanso 1:30' : 'Loguear set' }}
        </button>
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

  // ── Additive optional signal inputs (D-1 redesign, not breaking consumers) ─
  readonly setNumber = input<number | null>(null);
  readonly targetLabel = input<string>('');
  readonly lastSet = input<string | null>(null);
  readonly state = input<'idle' | 'logged'>('idle');
  /** Additive prefill via TargetSet (CC-5: legacy prefillWeightKg/prefillReps remain as fallback). */
  readonly prefillTarget = input<TargetSet | null>(null);

  private readonly fb = inject(FormBuilder);

  /** Reps options for the dropdown (1–50). Mixto input: reps via select. */
  readonly repsOptions: readonly number[] = Array.from({ length: 50 }, (_, i) => i + 1);

  readonly form = this.fb.group({
    reps: [0, [Validators.min(0)]],
    weightKg: [0, [Validators.min(0.1)]],
    extraWeightKg: [null as number | null],
    durationSec: [0, [Validators.min(0)]],
    distanceKm: [0, [Validators.min(0)]],
    note: [''],
  });

  constructor() {
    effect(() => {
      const target = this.prefillTarget();
      if (this.form.pristine) {
        this.form.patchValue(this.targetFormPatch(target));
      }
    });
  }

  ngOnInit(): void {
    // Legacy fallback: prefillWeightKg / prefillReps (CC-5 contract).
    // Only applied when no prefillTarget is set (target takes precedence).
    if (this.prefillTarget() === null) {
      if (this.prefillWeightKg !== undefined) {
        this.form.patchValue({ weightKg: this.prefillWeightKg });
      }
      if (this.prefillReps !== undefined) {
        this.form.patchValue({ reps: this.prefillReps });
      }
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    const logInput: LogSetInput = {
      sessionId: this.sessionId,
      exerciseId: this.exerciseId,
      targetSetIndex: this.targetSetIndex,
      type: this.trackingType,
      repsValue: value.reps ?? undefined,
      weightKgValue: value.weightKg ?? undefined,
      extraWeightKgValue: value.extraWeightKg ?? undefined,
      note: value.note || undefined,
    };

    this.setLogged.emit(logInput);
    this.form.reset(this.defaultFormValue());
  }

  /** Returns form reset values derived from prefillTarget (or legacy scalars, or 0). */
  private defaultFormValue(): {
    reps: number;
    weightKg: number;
    extraWeightKg: number | null;
    durationSec: number;
    distanceKm: number;
    note: string;
  } {
    const patch = this.targetFormPatch(this.prefillTarget());
    return {
      reps: patch.reps ?? this.prefillReps ?? 0,
      weightKg: patch.weightKg ?? this.prefillWeightKg ?? 0,
      extraWeightKg: patch.extraWeightKg ?? null,
      durationSec: 0,
      distanceKm: 0,
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
