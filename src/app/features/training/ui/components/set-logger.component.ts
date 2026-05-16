import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { LogSetInput } from '../../domain/use-cases/log-set.use-case';

@Component({
  selector: 'fg-set-logger',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="set-logger">
      @switch (trackingType) {
        @case ('weight-reps') {
          <div class="set-logger__field">
            <label for="weight">Peso (kg)</label>
            <input
              id="weight"
              type="number"
              step="0.25"
              min="0"
              formControlName="weightKg"
            />
          </div>
          <div class="set-logger__field">
            <label for="reps">Repeticiones</label>
            <input
              id="reps"
              type="number"
              min="0"
              formControlName="reps"
            />
          </div>
        }
        @case ('bodyweight-reps') {
          <div class="set-logger__field">
            <label for="extra-weight">Peso extra (kg, opcional)</label>
            <input
              id="extra-weight"
              type="number"
              step="0.25"
              min="0"
              formControlName="extraWeightKg"
            />
          </div>
          <div class="set-logger__field">
            <label for="reps-bw">Repeticiones</label>
            <input
              id="reps-bw"
              type="number"
              min="0"
              formControlName="reps"
            />
          </div>
        }
        @case ('time') {
          <div class="set-logger__field">
            <label for="duration">Duración (segundos)</label>
            <input
              id="duration"
              type="number"
              min="0"
              formControlName="durationSec"
            />
          </div>
        }
        @case ('distance-time') {
          <div class="set-logger__field">
            <label for="distance">Distancia (km)</label>
            <input
              id="distance"
              type="number"
              step="0.01"
              min="0"
              formControlName="distanceKm"
            />
          </div>
          <div class="set-logger__field">
            <label for="duration-dt">Duración (segundos)</label>
            <input
              id="duration-dt"
              type="number"
              min="0"
              formControlName="durationSec"
            />
          </div>
        }
      }

      <div class="set-logger__field">
        <label for="note">Nota (opcional)</label>
        <input id="note" type="text" formControlName="note" />
      </div>

      <button type="submit" [disabled]="form.invalid">
        ✓ Confirmar serie
      </button>
    </form>
  `,
})
export class SetLoggerComponent implements OnInit {
  @Input() trackingType: TrackingType = 'weight-reps';
  @Input() sessionId!: string;
  @Input() exerciseId!: string;
  @Input() targetSetIndex?: number;
  @Input() prefillWeightKg?: number;
  @Input() prefillReps?: number;

  @Output() setLogged = new EventEmitter<LogSetInput>();

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

  onSubmit(): void {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();

    const input: LogSetInput = {
      sessionId: this.sessionId,
      exerciseId: this.exerciseId,
      targetSetIndex: this.targetSetIndex,
      type: this.trackingType,
      repsValue: value.reps ?? undefined,
      weightKgValue: value.weightKg ?? undefined,
      extraWeightKgValue: value.extraWeightKg ?? undefined,
      note: value.note || undefined,
    };

    this.setLogged.emit(input);
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
