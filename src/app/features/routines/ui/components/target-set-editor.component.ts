import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TargetSet, assertNeverTargetSet } from '../../domain/target-set';
import { TrackingType } from '@core/shared/domain/tracking-type';

type SetField = 'reps' | 'weightKg' | 'extraWeightKg' | 'durationSec' | 'distanceKm';

@Component({
  selector: 'fg-target-set-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-medium">Series objetivo</h3>
        <button
          type="button"
          class="text-xs text-accent-500"
          (click)="addSet()"
        >
          + Agregar serie
        </button>
      </div>

      @for (set of targetSets(); track $index; let i = $index) {
        <div class="border rounded p-2 space-y-1">
          @switch (trackingType()) {
            @case ('weight-reps') {
              <div class="flex gap-2">
                <div class="flex-1">
                  <label [for]="'set-' + i + '-reps'" class="text-xs text-forge-400">Reps</label>
                  <input
                    [id]="'set-' + i + '-reps'"
                    type="number"
                    min="0"
                    class="w-full border rounded p-1 text-sm"
                    [value]="getSetField(i, 'reps')"
                    (change)="updateSetField(i, 'reps', $event)"
                  />
                </div>
                <div class="flex-1">
                  <label [for]="'set-' + i + '-weightKg'" class="text-xs text-forge-400">Peso (kg)</label>
                  <input
                    [id]="'set-' + i + '-weightKg'"
                    type="number"
                    min="0"
                    step="0.25"
                    class="w-full border rounded p-1 text-sm"
                    [value]="getSetField(i, 'weightKg')"
                    (change)="updateSetField(i, 'weightKg', $event)"
                  />
                </div>
              </div>
            }
            @case ('bodyweight-reps') {
              <div class="flex gap-2">
                <div class="flex-1">
                  <label [for]="'set-' + i + '-reps'" class="text-xs text-forge-400">Reps</label>
                  <input
                    [id]="'set-' + i + '-reps'"
                    type="number"
                    min="0"
                    class="w-full border rounded p-1 text-sm"
                    [value]="getSetField(i, 'reps')"
                    (change)="updateSetField(i, 'reps', $event)"
                  />
                </div>
                <div class="flex-1">
                  <label [for]="'set-' + i + '-extraWeightKg'" class="text-xs text-forge-400">Peso extra (kg)</label>
                  <input
                    [id]="'set-' + i + '-extraWeightKg'"
                    type="number"
                    min="0"
                    step="0.25"
                    class="w-full border rounded p-1 text-sm"
                    [value]="getSetField(i, 'extraWeightKg') ?? ''"
                    (change)="updateSetField(i, 'extraWeightKg', $event)"
                  />
                </div>
              </div>
            }
            @case ('time') {
              <div>
                <label [for]="'set-' + i + '-durationSec'" class="text-xs text-forge-400">Duración (seg)</label>
                <input
                  [id]="'set-' + i + '-durationSec'"
                  type="number"
                  min="0"
                  class="w-full border rounded p-1 text-sm"
                  [value]="getSetField(i, 'durationSec')"
                  (change)="updateSetField(i, 'durationSec', $event)"
                />
              </div>
            }
            @case ('distance-time') {
              <div class="flex gap-2">
                <div class="flex-1">
                  <label [for]="'set-' + i + '-distanceKm'" class="text-xs text-forge-400">Distancia (km)</label>
                  <input
                    [id]="'set-' + i + '-distanceKm'"
                    type="number"
                    min="0"
                    step="0.1"
                    class="w-full border rounded p-1 text-sm"
                    [value]="getSetField(i, 'distanceKm')"
                    (change)="updateSetField(i, 'distanceKm', $event)"
                  />
                </div>
                <div class="flex-1">
                  <label [for]="'set-' + i + '-durationSec'" class="text-xs text-forge-400">Duración (seg)</label>
                  <input
                    [id]="'set-' + i + '-durationSec'"
                    type="number"
                    min="0"
                    class="w-full border rounded p-1 text-sm"
                    [value]="getSetField(i, 'durationSec')"
                    (change)="updateSetField(i, 'durationSec', $event)"
                  />
                </div>
              </div>
            }
          }
          <button
            type="button"
            class="text-xs text-red-500"
            (click)="removeSet(i)"
          >
            Quitar
          </button>
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
