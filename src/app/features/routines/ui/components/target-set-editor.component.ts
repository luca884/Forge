import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TargetSet, assertNeverTargetSet } from '../../domain/target-set';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { FgButtonComponent } from '@core/shared/ui';

type SetField = 'reps' | 'weightKg' | 'extraWeightKg' | 'durationSec' | 'distanceKm';

@Component({
  selector: 'fg-target-set-editor',
  standalone: true,
  imports: [FgButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .target-num {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      background: transparent;
      border: none;
      outline: none;
      text-align: center;
      color: rgb(var(--forge-50));
      font-weight: 600;
      font-size: 22px;
      line-height: 1.2;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum";
    }
    .target-num::-webkit-outer-spin-button,
    .target-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  `],
  template: `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="t-body-sm font-medium text-forge-100">Series objetivo</h3>
        <button
          type="button"
          fg-button
          variant="ghost"
          size="sm"
          leadingIcon="plus"
          (click)="addSet()"
        >
          Agregar serie
        </button>
      </div>

      @for (set of targetSets(); track $index; let i = $index) {
        <div class="bg-forge-900 rounded-xl py-2.5 px-3 ring-1 ring-inset ring-white/5 space-y-2">
          @switch (trackingType()) {
            @case ('weight-reps') {
              <div class="grid grid-cols-2 gap-2">
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Reps</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-reps'"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      class="target-num"
                      [value]="getSetField(i, 'reps')"
                      (change)="updateSetField(i, 'reps', $event)"
                    />
                  </div>
                </label>
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Peso</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-weightKg'"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.25"
                      class="target-num"
                      [value]="getSetField(i, 'weightKg')"
                      (change)="updateSetField(i, 'weightKg', $event)"
                    />
                    <span class="t-caption text-forge-600">kg</span>
                  </div>
                </label>
              </div>
            }
            @case ('bodyweight-reps') {
              <div class="grid grid-cols-2 gap-2">
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Reps</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-reps'"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      class="target-num"
                      [value]="getSetField(i, 'reps')"
                      (change)="updateSetField(i, 'reps', $event)"
                    />
                  </div>
                </label>
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Peso extra</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-extraWeightKg'"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.25"
                      class="target-num"
                      [value]="getSetField(i, 'extraWeightKg') ?? ''"
                      (change)="updateSetField(i, 'extraWeightKg', $event)"
                    />
                    <span class="t-caption text-forge-600">kg</span>
                  </div>
                </label>
              </div>
            }
            @case ('time') {
              <div class="grid grid-cols-1 gap-2">
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Duración</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-durationSec'"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      class="target-num"
                      [value]="getSetField(i, 'durationSec')"
                      (change)="updateSetField(i, 'durationSec', $event)"
                    />
                    <span class="t-caption text-forge-600">seg</span>
                  </div>
                </label>
              </div>
            }
            @case ('distance-time') {
              <div class="grid grid-cols-2 gap-2">
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Distancia</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-distanceKm'"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.1"
                      class="target-num"
                      [value]="getSetField(i, 'distanceKm')"
                      (change)="updateSetField(i, 'distanceKm', $event)"
                    />
                    <span class="t-caption text-forge-600">km</span>
                  </div>
                </label>
                <label class="flex flex-col items-center gap-1">
                  <span class="t-caption text-forge-500">Duración</span>
                  <div class="flex items-baseline gap-1 w-full justify-center">
                    <input
                      [id]="'set-' + i + '-durationSec'"
                      type="number"
                      inputmode="numeric"
                      min="0"
                      class="target-num"
                      [value]="getSetField(i, 'durationSec')"
                      (change)="updateSetField(i, 'durationSec', $event)"
                    />
                    <span class="t-caption text-forge-600">seg</span>
                  </div>
                </label>
              </div>
            }
          }
          <div class="flex justify-end">
            <button
              type="button"
              fg-button
              variant="destructive"
              size="sm"
              leadingIcon="trash"
              (click)="removeSet(i)"
            >
              Quitar
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class TargetSetEditorComponent {
  readonly trackingType = input<TrackingType>('weight-reps');
  readonly targetSets = input<readonly TargetSet[]>([]);
  readonly targetSetsChange = output<TargetSet[]>();

  protected getSetField(index: number, field: SetField): number | undefined {
    const set = this.targetSets()[index];
    if (!set) return undefined;
    switch (set.type) {
      case 'weight-reps':
        if (field === 'reps') return set.reps;
        if (field === 'weightKg') return set.weightKg;
        return undefined;
      case 'bodyweight-reps':
        if (field === 'reps') return set.reps;
        if (field === 'extraWeightKg') return set.extraWeightKg;
        return undefined;
      case 'time':
        if (field === 'durationSec') return set.durationSec;
        return undefined;
      case 'distance-time':
        if (field === 'distanceKm') return set.distanceKm;
        if (field === 'durationSec') return set.durationSec;
        return undefined;
      default:
        return assertNeverTargetSet(set);
    }
  }

  protected updateSetField(index: number, field: SetField, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const value = parseFloat(raw);
    const next = isNaN(value) ? undefined : value;
    const updated = this.targetSets().map((s, i) => {
      if (i !== index) return s;
      return { ...s, [field]: next } as TargetSet;
    });
    this.targetSetsChange.emit(updated);
  }

  protected addSet(): void {
    let newSet: TargetSet;
    switch (this.trackingType()) {
      case 'weight-reps':
        newSet = { type: 'weight-reps', reps: 0, weightKg: undefined };
        break;
      case 'bodyweight-reps':
        newSet = { type: 'bodyweight-reps', reps: 0 };
        break;
      case 'time':
        newSet = { type: 'time', durationSec: 0 };
        break;
      case 'distance-time':
        newSet = { type: 'distance-time', distanceKm: 0, durationSec: 0 };
        break;
    }
    this.targetSetsChange.emit([...this.targetSets(), newSet]);
  }

  protected removeSet(index: number): void {
    this.targetSetsChange.emit(this.targetSets().filter((_, i) => i !== index));
  }
}
