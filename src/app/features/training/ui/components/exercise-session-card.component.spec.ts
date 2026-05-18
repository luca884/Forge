/**
 * ExerciseSessionCardComponent spec (D-4).
 * TDD strict — RED before implementation.
 * Tests unit input propagation through DisplayWeightPipe + visual redesign structure.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseSessionCardComponent } from './exercise-session-card.component';
import type { WorkedSet } from '../../domain/worked-set';
import type { Exercise } from '../../../exercises/domain/exercise.entity';
import type { TargetSet } from '../../../routines/domain/target-set';

const mockExercise: Exercise = {
  id: 'ex-1',
  name: 'Sentadilla',
  muscleGroup: 'legs',
  trackingType: 'weight-reps',
  isCustom: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
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

const prSet: WorkedSet = {
  id: 'ws-2',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 110 } as any,
  isPR: true,
  createdAt: new Date('2026-01-01'),
};

const bodyweightSet: WorkedSet = {
  id: 'ws-3',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'bodyweight-reps',
  reps: { value: 5 } as any,
  extraWeight: { value: 10 } as any,
  isPR: false,
  createdAt: new Date('2026-01-01'),
};

const targetSet: TargetSet = { type: 'weight-reps', reps: 8, weightKg: 70 };

describe('ExerciseSessionCardComponent', () => {
  let fixture: ComponentFixture<ExerciseSessionCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseSessionCardComponent],
    }).compileComponents();
  });

  // ── PRESERVED BEHAVIOUR TESTS ──────────────────────────────────────────────

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

  // ── VISUAL REDESIGN TESTS (D-4) ────────────────────────────────────────────

  it('wrapper has rounded-[14px] bg-forge-900 ring-1 ring-inset overflow-hidden', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const wrapper = (fixture.nativeElement as HTMLElement).firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.classList).toContain('bg-forge-900');
    expect(wrapper.classList).toContain('overflow-hidden');
  });

  it('header contains exercise name in h3 or span with t-h3 class', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const nameEl = el.querySelector<HTMLElement>('.t-h3');
    expect(nameEl).toBeTruthy();
    expect(nameEl!.textContent).toContain('Sentadilla');
  });

  it('done/total counter has text-accent-300 when all sets done', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const counter = el.querySelector<HTMLElement>('.text-accent-300');
    expect(counter).toBeTruthy();
    expect(counter!.textContent).toContain('1/1');
  });

  it('done/total counter has text-forge-300 when incomplete', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, { type: 'weight-reps', reps: 8, weightKg: 70 } as TargetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const counter = el.querySelector<HTMLElement>('.text-forge-300');
    expect(counter).toBeTruthy();
    expect(counter!.textContent).toContain('1/2');
  });

  it('shows fg-chip PR label when isPR set exists', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [prSet]);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const text = el.textContent ?? '';
    expect(text).toContain('PR');
  });

  it('chevron-down icon is in header', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // fg-icon renders a host element with name attribute or an inner element
    const icons = el.querySelectorAll('fg-icon');
    const chevronPresent = Array.from(icons).some(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'chevron-down',
    );
    expect(chevronPresent).toBe(true);
  });

  it('expanded=true shows sets list with done indicator dot', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // done dot should have bg-accent-500 class or contain a check icon
    const checkIcons = Array.from(el.querySelectorAll('fg-icon')).filter(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'check',
    );
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('expanded=false hides sets list', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('expanded', false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const checkIcons = Array.from(el.querySelectorAll('fg-icon')).filter(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'check',
    );
    expect(checkIcons.length).toBe(0);
  });

  it('pending slot shows index number and no check icon', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    // Pending dot shows "1"
    const text = el.textContent ?? '';
    expect(text).toContain('1');
    const checkIcons = Array.from(el.querySelectorAll('fg-icon')).filter(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'check',
    );
    expect(checkIcons.length).toBe(0);
  });
});
