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
  weightUnit: 'kg',
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

  // ── PREFILL TARGET PROPAGATION TESTS ──────────────────────────────────────

  it('nextTarget returns the target at loggedSets.length index when in range', () => {
    const t1: TargetSet = { type: 'weight-reps', reps: 5, weightKg: 100 };
    const t2: TargetSet = { type: 'weight-reps', reps: 8, weightKg: 80 };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]); // 1 done
    fixture.componentRef.setInput('targetSets', [t1, t2]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    // loggedSets.length = 1, so nextTarget should be t2
    expect(fixture.componentInstance.nextTarget).toEqual(t2);
  });

  it('nextTarget falls back to last target when loggedSets.length is out of range', () => {
    const t1: TargetSet = { type: 'weight-reps', reps: 5, weightKg: 100 };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet, weightRepsSet]); // 2 done, only 1 target
    fixture.componentRef.setInput('targetSets', [t1]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    // out of range → falls back to last target
    expect(fixture.componentInstance.nextTarget).toEqual(t1);
  });

  it('nextTarget returns null when targetSets is empty', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.nextTarget).toBeNull();
  });

  // ── No over-logging: logger hidden once target reached ─────────────────────

  it('hides the set-logger once the target sets are reached', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]); // 2 target
    fixture.componentRef.setInput('loggedSets', [weightRepsSet, weightRepsSet]); // 2 logged → done
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('fg-set-logger')).toBeNull();
  });

  it('shows the set-logger while sets are still pending', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]); // 2 target
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]); // 1 logged → pending
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('fg-set-logger')).toBeTruthy();
  });

  // Regression: derived state must react to loggedSets changing on a PERSISTENT card
  // (focused view). computed() over plain @Input would memoize once and go stale.
  it('reacts to loggedSets changing on a live card: hides logger + clears pending slots at target', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]); // 2 target
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]); // 1 logged
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fg-set-logger')).toBeTruthy();
    expect(fixture.componentInstance.pendingSlots().length).toBe(1);

    // Log the 2nd set on the SAME instance → completes the target.
    fixture.componentRef.setInput('loggedSets', [weightRepsSet, weightRepsSet]);
    fixture.detectChanges();

    expect(el.querySelector('fg-set-logger')).toBeNull();
    expect(fixture.componentInstance.pendingSlots().length).toBe(0);
  });

  // ── EDIT / REMOVE PAST SETS (slice 2) ──────────────────────────────────────

  it('cada set logueado es un botón "Editar set" tappable', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('button[aria-label="Editar set"]')).toBeTruthy();
  });

  it('tap en la fila abre el editor inline (fg-set-logger en modo edición)', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]); // allDone → logger de logueo oculto
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    // allDone → no hay logger de logueo
    expect(el.querySelector('fg-set-logger')).toBeNull();

    const row = el.querySelector<HTMLButtonElement>('button[aria-label="Editar set"]')!;
    row.click();
    fixture.detectChanges();

    // ahora aparece el editor inline para ese set
    expect(el.querySelector('fg-set-logger')).toBeTruthy();
    expect(fixture.componentInstance.editingSetId()).toBe('ws-1');
  });

  it('onSetEdited re-emite setEdited hacia arriba y cierra el editor', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    fixture.componentInstance.startEdit('ws-1');
    const captured: WorkedSet[] = [];
    fixture.componentInstance.setEdited.subscribe((s: WorkedSet) => captured.push(s));

    const updated = { ...weightRepsSet, reps: { value: 12 } as never };
    fixture.componentInstance.onSetEdited(updated);

    expect(captured).toEqual([updated]);
    expect(fixture.componentInstance.editingSetId()).toBeNull();
  });

  it('onSetRemoved re-emite setRemoved hacia arriba y cierra el editor', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    fixture.componentInstance.startEdit('ws-1');
    const removed: string[] = [];
    fixture.componentInstance.setRemoved.subscribe((id: string) => removed.push(id));

    fixture.componentInstance.onSetRemoved('ws-1');

    expect(removed).toEqual(['ws-1']);
    expect(fixture.componentInstance.editingSetId()).toBeNull();
  });

  // ── PROGRESSION TARGET propagation (slice 1, refactored to object in slice 2) ─

  const wrProgressionTarget = {
    weightKg: 82.5,
    reps: 8,
    previousBest: { weightKg: 80, reps: 8 },
  };

  it('progressionTargetData object → formatted target text visible in set-logger', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', wrProgressionTarget);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('82.5kg × 8');
    expect(text).toContain('superá 80kg × 8');
  });

  it('progressionTargetData null — does not render objective text', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', null);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Objetivo');
  });

  // ── SLICE 2: "¡Objetivo cumplido!" badge per logged set ────────────────────

  it('shows "¡Objetivo cumplido!" badge on a logged set that meets the target', () => {
    // logged set: 100kg × 5 — target requires 82.5kg × 8. weight ok but reps short → NO badge.
    // Use a set that clearly meets: 90kg × 10 vs target 82.5kg × 8.
    const meetingSet: WorkedSet = {
      id: 'ws-meet', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 10 } as any, weight: { value: 90 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [meetingSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', wrProgressionTarget);
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('¡Objetivo cumplido!');
  });

  it('does NOT show the badge on a logged set that does not meet the target', () => {
    // 80kg × 8 — target requires 82.5kg → weight short → no badge.
    const shortSet: WorkedSet = {
      id: 'ws-short', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 8 } as any, weight: { value: 80 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [shortSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', wrProgressionTarget);
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('¡Objetivo cumplido!');
  });

  it('does NOT show the badge when progressionTargetData is null', () => {
    const meetingSet: WorkedSet = {
      id: 'ws-meet', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 10 } as any, weight: { value: 90 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [meetingSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', null);
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('¡Objetivo cumplido!');
  });

  it('meetsTarget() plain method returns true for a meeting set and false otherwise', () => {
    const meetingSet: WorkedSet = {
      id: 'ws-meet', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 10 } as any, weight: { value: 90 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [meetingSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', wrProgressionTarget);
    fixture.detectChanges();

    expect(fixture.componentInstance.meetsTarget(meetingSet)).toBe(true);
    expect(fixture.componentInstance.meetsTarget(weightRepsSet)).toBe(false); // 100kg × 5 → reps short
  });

  it('badge reacts on a live card when loggedSets changes (no computed-over-Input staleness)', () => {
    const shortSet: WorkedSet = {
      id: 'ws-short', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 8 } as any, weight: { value: 80 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    const meetingSet: WorkedSet = {
      id: 'ws-meet', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 10 } as any, weight: { value: 90 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [shortSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', wrProgressionTarget);
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').not.toContain('¡Objetivo cumplido!');

    // Add a meeting set on the same live instance
    fixture.componentRef.setInput('loggedSets', [shortSet, meetingSet]);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent ?? '').toContain('¡Objetivo cumplido!');
  });

  it('cancelEdit cierra el editor sin emitir nada', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    fixture.componentInstance.startEdit('ws-1');
    expect(fixture.componentInstance.editingSetId()).toBe('ws-1');

    fixture.componentInstance.cancelEdit();
    expect(fixture.componentInstance.editingSetId()).toBeNull();
  });
});
