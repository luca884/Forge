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

  it('wrapper is a Cuaderno surface section (bg-surface, border-line, overflow-hidden)', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const wrapper = (fixture.nativeElement as HTMLElement).firstElementChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.tagName).toBe('SECTION');
    expect(wrapper.classList).toContain('bg-surface');
    expect(wrapper.classList).toContain('border-line');
    expect(wrapper.classList).toContain('overflow-hidden');
  });

  it('uses only semantic Cuaderno classes (no forge-*, accent-<n>, ring-white, destructive-*)', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet, prSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).not.toMatch(/forge-\d|accent-\d|ring-white|destructive-\d|--pr-warm/);
  });

  it('header names the section with an h2 holding the exercise name', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', []);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const nameEl = el.querySelector<HTMLElement>('h2');
    expect(nameEl).toBeTruthy();
    expect(nameEl!.textContent).toContain('Sentadilla');
    const section = el.querySelector('section')!;
    expect(section.getAttribute('aria-labelledby')).toBe(nameEl!.id);
  });

  it('done/total counter is accent-ink when all series done', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const counter = el.querySelector<HTMLElement>('[data-set-counter]');
    expect(counter).toBeTruthy();
    expect(counter!.classList).toContain('text-accent-ink');
    expect(counter!.textContent).toContain('1/1 series');
  });

  it('done/total counter is ink-2 when incomplete', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, { type: 'weight-reps', reps: 8, weightKg: 70 } as TargetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const counter = el.querySelector<HTMLElement>('[data-set-counter]');
    expect(counter).toBeTruthy();
    expect(counter!.classList).toContain('text-ink-2');
    expect(counter!.textContent).toContain('1/2 series');
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

  it('planilla: column header row names Serie, Anterior, Peso, Reps and Hecha', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const head = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-sheet-head]');
    expect(head).toBeTruthy();
    const labels = Array.from(head!.children).map((c) => c.textContent?.trim());
    expect(labels).toEqual(['Serie', 'Anterior', 'Peso', 'Reps', 'Hecha']);
  });

  it('planilla: bodyweight-reps header says Extra instead of Peso', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', { ...mockExercise, trackingType: 'bodyweight-reps' });
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [{ type: 'bodyweight-reps', reps: 10 } as TargetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const head = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-sheet-head]')!;
    const labels = Array.from(head.children).map((c) => c.textContent?.trim());
    expect(labels).toEqual(['Serie', 'Anterior', 'Extra', 'Reps', 'Hecha']);
  });

  it('planilla: done row shows number, weight through the preferred unit, reps and a check', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('button[aria-label="Editar set"]')!;
    const cells = Array.from(row.querySelectorAll<HTMLElement>('[data-cell]')).map((c) => c.textContent?.trim());
    expect(cells).toEqual(['1', '—', '220.5 lb', '5']);
    expect(row.querySelector('fg-icon[name="check"]')).toBeTruthy();
  });

  it('planilla: the Anterior column shows what was done in that slot last time', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('previousSessionSets', [
      {
        id: 'p-0', sessionId: 's-prev', exerciseId: 'ex-1', targetSetIndex: 0, type: 'weight-reps',
        reps: { value: 8 } as any, weight: { value: 20 } as any, isPR: false, createdAt: new Date('2026-02-08'),
      },
      {
        id: 'p-1', sessionId: 's-prev', exerciseId: 'ex-1', targetSetIndex: 1, type: 'weight-reps',
        reps: { value: 7 } as any, weight: { value: 20 } as any, isPR: false, createdAt: new Date('2026-02-08'),
      },
    ]);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const done = el.querySelector<HTMLElement>('button[aria-label="Editar set"] [data-cell="prev"]')!;
    expect(done.textContent?.trim()).toBe('20 kg × 8');
    const pending = el.querySelector<HTMLElement>('[data-pending-row] [data-cell="prev"]')!;
    expect(pending.textContent?.trim()).toBe('20 kg × 7');
  });

  it('planilla: pending rows show the planned target of that slot and an empty check box', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-pending-row]')!;
    const cells = Array.from(row.querySelectorAll<HTMLElement>('[data-cell]')).map((c) => c.textContent?.trim());
    expect(cells).toEqual(['1', '—', '154.3 lb', '8']);
    expect(row.getAttribute('aria-current')).toBe('step');
  });

  // ── CABECERA: objetivo y descanso ─────────────────────────────────────────

  it('header meta shows the target with weight in the preferred unit', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    expect(fixture.componentInstance.targetLabel()).toBe('Objetivo 2 × 8 · 154.3 lb');
    fixture.componentRef.setInput('unit', 'kg');
    fixture.detectChanges();
    expect(fixture.componentInstance.targetLabel()).toBe('Objetivo 2 × 8 · 70 kg');
  });

  it('header meta shows the rest time only when the host provides it (0 hides it)', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('descanso');

    fixture.componentRef.setInput('restSeconds', 120);
    fixture.detectChanges();
    expect(el.textContent).toContain('descanso 2:00');

    fixture.componentRef.setInput('restSeconds', 90);
    fixture.detectChanges();
    expect(el.textContent).toContain('descanso 1:30');

    fixture.componentRef.setInput('restSeconds', 0);
    fixture.detectChanges();
    expect(el.textContent).not.toContain('descanso');
  });

  it('shows the exercise note under the sets when provided', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('note', 'Pausa de 1 s abajo.');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pausa de 1 s abajo.');
  });

  it('passes the next series number to the logger', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]);
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('fg-set-logger')!.textContent).toContain('Serie 2');
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
    // a done set shows a check icon
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

  it('no renderiza el objetivo de doble progresión aunque haya progressionTargetData', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', wrProgressionTarget);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('superá');
    expect(text).not.toContain('Objetivo:');
  });

  // ── PREFILL CON LO DE LA ÚLTIMA VEZ ────────────────────────────────────────

  function prevWRSet(id: string, reps: number, weightKg: number, slot: number): WorkedSet {
    return {
      id,
      sessionId: 's-prev',
      exerciseId: 'ex-1',
      targetSetIndex: slot,
      type: 'weight-reps',
      reps: { value: reps } as any,
      weight: { value: weightKg } as any,
      isPR: false,
      createdAt: new Date('2026-02-08'),
    };
  }

  it('pasa al set-logger el set del mismo slot de la sesión anterior', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet]); // próximo slot = índice 1
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('previousSessionSets', [
      prevWRSet('p-0', 8, 20, 0),
      prevWRSet('p-1', 7, 20, 1),
      prevWRSet('p-2', 6, 17.5, 2),
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.previousSetForNextSlot()?.id).toBe('p-1');
  });

  it('usa el último set previo disponible cuando la sesión anterior tuvo menos sets', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', [weightRepsSet, prSet]); // próximo slot = índice 2
    fixture.componentRef.setInput('targetSets', [targetSet, targetSet, targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('previousSessionSets', [
      prevWRSet('p-0', 8, 20, 0),
      prevWRSet('p-1', 7, 20, 1),
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.previousSetForNextSlot()?.id).toBe('p-1');
  });

  it('sin historial previo no pasa ningún set al logger', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('previousSessionSets', []);
    fixture.detectChanges();

    expect(fixture.componentInstance.previousSetForNextSlot()).toBeNull();
  });

  it('los inputs del logger arrancan con los valores de la última vez', () => {
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', mockExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('previousSessionSets', [prevWRSet('p-0', 8, 20, 0)]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const weightInput = el.querySelector<HTMLInputElement>('input[aria-label="Peso en kg"]')!;
    expect(weightInput.value).toBe('20');
  });

  // ── SLICE B: progresión en placas — formato "placa N × R" ──────────────────

  it('placas: el input de placas arranca con las placas de la última vez', () => {
    const platesExercise: Exercise = { ...mockExercise, weightUnit: 'plates' };
    // weight.value porta el número de placa: la última vez fueron 5 placas × 12
    const prevPlateSet: WorkedSet = {
      id: 'p-plate', sessionId: 's-prev', exerciseId: 'ex-1', targetSetIndex: 0,
      type: 'weight-reps', reps: { value: 12 } as any, weight: { value: 5 } as any,
      isPR: false, createdAt: new Date('2026-02-08'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', platesExercise);
    fixture.componentRef.setInput('loggedSets', []);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('previousSessionSets', [prevPlateSet]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const platesInput = el.querySelector<HTMLInputElement>('input[aria-label="Placas"]')!;
    expect(platesInput.value).toBe('5');
  });

  it('placas: badge "¡Objetivo cumplido!" cuando el set logueado alcanza placa+reps', () => {
    const platesExercise: Exercise = { ...mockExercise, weightUnit: 'plates' };
    const platesTarget = {
      weightKg: 6,
      reps: 12,
      previousBest: { weightKg: 5, reps: 12 },
    };
    // set logueado: placa 6 × 12 (la magnitud de placa viaja en weight.value)
    const meetingSet: WorkedSet = {
      id: 'ws-plate', sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 12 } as any, weight: { value: 6 } as any, isPR: false, createdAt: new Date('2026-01-01'),
    };
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', platesExercise);
    fixture.componentRef.setInput('loggedSets', [meetingSet]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('progressionTargetData', platesTarget);
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('¡Objetivo cumplido!');
  });

  it('placas (D4): una placa se lee "1 placa" y varias "N placas", nunca en kg ni en lb', () => {
    const platesExercise: Exercise = { ...mockExercise, weightUnit: 'plates' };
    const plateSet = (id: string, plates: number): WorkedSet => ({
      id, sessionId: 's-1', exerciseId: 'ex-1', type: 'weight-reps',
      reps: { value: 10 } as any, weight: { value: plates } as any, isPR: false, createdAt: new Date('2026-01-01'),
    });
    fixture = TestBed.createComponent(ExerciseSessionCardComponent);
    fixture.componentRef.setInput('exercise', platesExercise);
    fixture.componentRef.setInput('unit', 'lb');
    fixture.componentRef.setInput('loggedSets', [plateSet('ws-1', 1), plateSet('ws-2', 7)]);
    fixture.componentRef.setInput('targetSets', [targetSet]);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.detectChanges();

    const [one, many] = fixture.componentInstance.loggedSets.map((s) => fixture.componentInstance.setCells(s)[0]);
    expect(one).toBe('1 placa');
    expect(many).toBe('7 placas');
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
