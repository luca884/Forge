import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercise } from '../../../exercises/domain/exercise.entity';
import { TargetSet } from '../../../routines/domain/target-set';
import { WorkedSet } from '../../domain/worked-set';
import { SetLoggerComponent } from './set-logger.component';
import { LogSetInput } from '../../domain/use-cases/log-set.use-case';

@Component({
  selector: 'fg-exercise-session-card',
  standalone: true,
  imports: [SetLoggerComponent],
  template: `
    <div class="exercise-card">
      <h3 class="exercise-card__name">{{ exercise.name }}</h3>
      <p class="exercise-card__muscle">{{ exercise.muscleGroup }}</p>

      <div class="exercise-card__sets">
        <h4>Series completadas ({{ loggedSets.length }} / {{ targetSets.length }})</h4>

        @for (set of loggedSets; track set.id) {
          <div class="exercise-card__set" [class.exercise-card__set--pr]="set.isPR">
            @switch (set.type) {
              @case ('weight-reps') {
                <span>{{ set.reps.value }} reps × {{ set.weight.value }} kg</span>
              }
              @case ('bodyweight-reps') {
                <span>{{ set.reps.value }} reps
                  @if (set.extraWeight) {
                    (+ {{ set.extraWeight.value }} kg)
                  }
                </span>
              }
              @case ('time') {
                <span>{{ set.durationSec }}s</span>
              }
              @case ('distance-time') {
                <span>{{ set.distanceKm }} km en {{ set.durationSec }}s</span>
              }
            }
            @if (set.isPR) {
              <span class="exercise-card__pr-badge">PR</span>
            }
          </div>
        } @empty {
          <p class="exercise-card__empty">Sin series registradas</p>
        }
      </div>

      @if (sessionId) {
        <fg-set-logger
          [trackingType]="exercise.trackingType"
          [sessionId]="sessionId"
          [exerciseId]="exercise.id"
          [targetSetIndex]="loggedSets.length"
          (setLogged)="onSetLogged($event)"
        />
      }
    </div>
  `,
})
export class ExerciseSessionCardComponent {
  @Input() exercise!: Exercise;
  @Input() targetSets: readonly TargetSet[] = [];
  @Input() loggedSets: WorkedSet[] = [];
  @Input() sessionId!: string;

  @Output() setLogged = new EventEmitter<LogSetInput>();

  onSetLogged(input: LogSetInput): void {
    this.setLogged.emit(input);
  }
}
