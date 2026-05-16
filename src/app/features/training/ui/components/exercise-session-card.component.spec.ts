/**
 * ExerciseSessionCardComponent spec (D-2).
 * TDD strict — RED before implementation.
 * Tests unit input propagation through DisplayWeightPipe.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseSessionCardComponent } from './exercise-session-card.component';
import type { WorkedSet } from '../../domain/worked-set';
import type { Exercise } from '../../../exercises/domain/exercise.entity';

const mockExercise: Exercise = {
  id: 'ex-1',
  name: 'Sentadilla',
  muscleGroup: 'Piernas',
  trackingType: 'weight-reps',
};

const weightRepsSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

const bodyweightSet: WorkedSet = {
  id: 'ws-2',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'bodyweight-reps',
  reps: { value: 5 } as any,
  extraWeight: { value: 10 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

describe('ExerciseSessionCardComponent', () => {
  let fixture: ComponentFixture<ExerciseSessionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseSessionCardComponent],
    }).compileComponents();
  });

  it('renders weight-reps set with unit="kg" showing kg suffix', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('unit', 'kg');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
  });

  it('renders weight-reps set with unit="lb" showing lb value', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });

  it('renders bodyweight-reps extra weight with unit="lb" showing lb value', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [bodyweightSet]);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('22.0 lb');
  });
});
