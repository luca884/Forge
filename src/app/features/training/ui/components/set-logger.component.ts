import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  input,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { LogSetInput } from '../../domain/use-cases/log-set.use-case';
import { FgButtonComponent } from '@core/shared/ui';
import { FgCardComponent } from '@core/shared/ui';
import { FgIconComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-set-logger',
  standalone: true,
  imports: [ReactiveFormsModule, FgButtonComponent, FgCardComponent, FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .stepper-btn {
      width: 36px;
      height: 36px;
      border-radius: 9999px;
      border: none;
      background: rgb(var(--forge-850));
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,.05);
      color: rgb(var(--forge-300));
    }
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
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Peso</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('weightKg', 2.5)" aria-label="Disminuir peso">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.weightKg.value }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">kg</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('weightKg', 2.5)" aria-label="Aumentar peso">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Reps</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('reps', 1)" aria-label="Disminuir reps">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.reps.value }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">reps</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('reps', 1)" aria-label="Aumentar reps">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
            </div>
          }
          @case ('bodyweight-reps') {
            <div class="grid grid-cols-2 gap-2.5 mb-3">
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Extra (kg)</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('extraWeightKg', 2.5)" aria-label="Disminuir peso extra">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.extraWeightKg.value ?? 0 }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">kg</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('extraWeightKg', 2.5)" aria-label="Aumentar peso extra">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Reps</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('reps', 1)" aria-label="Disminuir reps">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.reps.value }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">reps</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('reps', 1)" aria-label="Aumentar reps">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
            </div>
          }
          @case ('time') {
            <div class="grid grid-cols-1 gap-2.5 mb-3">
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Duración</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('durationSec', 5)" aria-label="Disminuir duración">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.durationSec.value }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">seg</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('durationSec', 5)" aria-label="Aumentar duración">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
            </div>
          }
          @case ('distance-time') {
            <div class="grid grid-cols-2 gap-2.5 mb-3">
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Distancia</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('distanceKm', 0.5)" aria-label="Disminuir distancia">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.distanceKm.value }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">km</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('distanceKm', 0.5)" aria-label="Aumentar distancia">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
              <div class="bg-forge-900 rounded-xl py-2.5 ring-1 ring-inset ring-white/5 flex flex-col items-center gap-1">
                <span class="t-caption text-forge-500">Duración</span>
                <div class="flex items-center justify-between gap-3 w-full px-1">
                  <button type="button" class="stepper-btn" (click)="decrement('durationSec', 5)" aria-label="Disminuir duración">
                    <fg-icon name="minus" size="16"></fg-icon>
                  </button>
                  <div class="text-center flex-1 min-w-0">
                    <div class="t-num text-[32px] font-semibold text-forge-50 tracking-[-0.025em] leading-none tabular-nums">{{ form.controls.durationSec.value }}</div>
                    <div class="t-caption text-forge-600 mt-0.5">seg</div>
                  </div>
                  <button type="button" class="stepper-btn" (click)="increment('durationSec', 5)" aria-label="Aumentar duración">
                    <fg-icon name="plus" size="16"></fg-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        }

        @if (lastSet()) {
          <div class="t-body-sm text-forge-500 mb-2.5 flex items-center gap-1.5">
            <fg-icon name="history" size="12"></fg-icon>
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

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    reps: [0, [Validators.min(0)]],
    weightKg: [0, [Validators.min(0)]],
    extraWeightKg: [null as number | null],
    durationSec: [0, [Validators.min(0)]],
    distanceKm: [0, [Validators.min(0)]],
    note: [''],
  });

  ngOnInit(): void {
    if (this.prefillWeightKg !== undefined) {
      this.form.patchValue({ weightKg: this.prefillWeightKg });
    }
    if (this.prefillReps !== undefined) {
      this.form.patchValue({ reps: this.prefillReps });
    }
  }

  increment(
    field: 'weightKg' | 'reps' | 'extraWeightKg' | 'durationSec' | 'distanceKm',
    step: number,
  ): void {
    const ctrl = this.form.controls[field];
    if (!ctrl) return;
    const next = (ctrl.value ?? 0) + step;
    ctrl.setValue(next);
  }

  decrement(
    field: 'weightKg' | 'reps' | 'extraWeightKg' | 'durationSec' | 'distanceKm',
    step: number,
  ): void {
    const ctrl = this.form.controls[field];
    if (!ctrl) return;
    const next = Math.max(0, (ctrl.value ?? 0) - step);
    ctrl.setValue(next);
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
    this.form.reset({
      reps: this.prefillReps ?? 0,
      weightKg: this.prefillWeightKg ?? 0,
      extraWeightKg: null,
      durationSec: 0,
      distanceKm: 0,
      note: '',
    });
  }
}
