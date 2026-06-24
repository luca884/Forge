/**
 * SetLoggerComponent spec (D-1, ADR-34).
 * TDD strict — RED before implementation.
 * Tests preserved API behaviour + visual redesign (fg-card, NumericStepper inline, fg-button).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetLoggerComponent } from './set-logger.component';
import type { LogSetInput } from '../../domain/use-cases/log-set.use-case';
import type { TargetSet } from '@features/routines/domain/target-set';
import type { WorkedSet } from '../../domain/worked-set';

describe('SetLoggerComponent', () => {
  let fixture: ComponentFixture<SetLoggerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetLoggerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SetLoggerComponent);
  });

  // ── PRESERVED BEHAVIOUR TESTS ──────────────────────────────────────────────

  it('renders the component selector (fg-set-logger)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('setLogged output emits correct LogSetInput for weight-reps', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();

    const captured: LogSetInput[] = [];
    fixture.componentInstance.setLogged.subscribe((v: LogSetInput) => captured.push(v));

    // Set form values
    fixture.componentInstance.form.patchValue({ weightKg: 80, reps: 8 });
    fixture.detectChanges();

    // Submit
    const form = (fixture.nativeElement as HTMLElement).querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({
      type: 'weight-reps',
      weightKgValue: 80,
      repsValue: 8,
      sessionId: 's-1',
      exerciseId: 'ex-1',
    });
  });

  it('prefillWeightKg patches form control weightKg on init', () => {
    fixture.componentRef.setInput('prefillWeightKg', 90);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(90);
  });

  it('prefillReps patches form control reps on init', () => {
    fixture.componentRef.setInput('prefillReps', 10);
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.reps.value).toBe(10);
  });

  // ── VISUAL REDESIGN TESTS (D-1) ────────────────────────────────────────────

  it('root contains fg-card element', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.detectChanges();
    const card = (fixture.nativeElement as HTMLElement).querySelector('fg-card');
    expect(card).toBeTruthy();
  });

  it('submit button has fg-button attribute in idle state (variant="primary")', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('state', 'idle');
    fixture.detectChanges();
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[fg-button]');
    expect(btn).toBeTruthy();
  });

  it('submit button has variant="accent_soft" when state="logged"', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('state', 'logged');
    fixture.detectChanges();

    // The button host has Tailwind classes from VARIANT_CLASSES['accent_soft']
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[fg-button]');
    expect(btn).toBeTruthy();
    // accent_soft variant applies bg-accent-500/12 class
    expect(btn!.className).toContain('bg-accent-500/12');
  });

  it('weight-reps usa input numérico de peso (no steppers) y actualiza weightKg al tipear', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();

    // ya no hay botones +/- de peso
    const oldSteppers = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Aumentar peso"], button[aria-label="Disminuir peso"]');
    expect(oldSteppers.length).toBe(0);

    const input = (fixture.nativeElement as HTMLElement).querySelector('input[aria-label="Peso en kg"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = '82.5';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(82.5);
  });

  it('weight-reps usa un wheel-picker de reps (no un select fullscreen) integrado al form', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();

    // ya no hay select nativo (el que abría el picker que tapaba la pantalla)
    const select = (fixture.nativeElement as HTMLElement).querySelector('select[aria-label="Repeticiones"]');
    expect(select).toBeNull();

    // hay un wheel-picker para reps
    const wheel = (fixture.nativeElement as HTMLElement).querySelector('fg-wheel-picker [aria-label="Repeticiones"]');
    expect(wheel).toBeTruthy();

    // sigue integrado al form control via CVA
    fixture.componentInstance.form.controls.reps.setValue(8);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.reps.value).toBe(8);
  });

  it('header shows SET label when setNumber input provided', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('setNumber', 4);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('SET 4');
  });

  it('lastSet section is not rendered when lastSet input is null', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('lastSet', null);
    fixture.detectChanges();

    const historyIcons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('fg-icon'),
    ).filter((el) => (el as HTMLElement).getAttribute('name') === 'history');
    expect(historyIcons.length).toBe(0);
  });

  it('lastSet section is rendered with history icon when lastSet is provided', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('lastSet', '80 kg × 8');
    fixture.detectChanges();

    const historyIcon = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('fg-icon'),
    ).find((el) => (el as HTMLElement).getAttribute('name') === 'history');
    expect(historyIcon).toBeTruthy();
  });

  it('shows "Loguear set" text in idle state', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('state', 'idle');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Loguear set');
  });

  it('shows "Set logueado" text in logged state', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('state', 'logged');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Set logueado');
  });

  // ── WEIGHT VALIDATOR min(0.1) — carry-over E1 ─────────────────────────────

  it('form is INVALID when weightKg=0 for weight-reps (peso debe ser > 0)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();

    // Default initial value is 0 — should be invalid after fixing min to 0.1
    fixture.componentInstance.form.controls.weightKg.setValue(0);
    expect(fixture.componentInstance.form.controls.weightKg.valid).toBe(false);
  });

  it('form is VALID when weightKg=0.5 for weight-reps', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();

    fixture.componentInstance.form.controls.weightKg.setValue(0.5);
    expect(fixture.componentInstance.form.controls.weightKg.valid).toBe(true);
  });

  // ── weightKg min(0.1) NO debe bloquear tipos sin peso (fix logueo no-peso) ──

  it('bodyweight-reps: el form es VÁLIDO con solo reps (weightKg no bloquea)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'bodyweight-reps');
    fixture.detectChanges();

    fixture.componentInstance.form.controls.reps.setValue(10);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  it('time: el form es VÁLIDO con solo duración (weightKg no bloquea)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'time');
    fixture.detectChanges();

    fixture.componentInstance.form.controls.durationSec.setValue(30);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  it('distance-time: el form es VÁLIDO con distancia y duración (weightKg no bloquea)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'distance-time');
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ distanceKm: 5, durationSec: 1200 });
    fixture.detectChanges();

    expect(fixture.componentInstance.form.valid).toBe(true);
  });

  // ── onSubmit manda durationSec/distanceKm (no se pierden) ──────────────────

  it('time: setLogged emite durationSecValue (no lo pierde)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'time');
    fixture.detectChanges();

    const captured: LogSetInput[] = [];
    fixture.componentInstance.setLogged.subscribe((v: LogSetInput) => captured.push(v));

    fixture.componentInstance.form.patchValue({ durationSec: 45 });
    fixture.componentInstance.onSubmit();

    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({ type: 'time', durationSecValue: 45 });
  });

  it('distance-time: setLogged emite distanceKmValue y durationSecValue', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'distance-time');
    fixture.detectChanges();

    const captured: LogSetInput[] = [];
    fixture.componentInstance.setLogged.subscribe((v: LogSetInput) => captured.push(v));

    fixture.componentInstance.form.patchValue({ distanceKm: 5, durationSec: 1200 });
    fixture.componentInstance.onSubmit();

    expect(captured).toHaveLength(1);
    expect(captured[0]).toMatchObject({ type: 'distance-time', distanceKmValue: 5, durationSecValue: 1200 });
  });

  it('submit button is disabled when weightKg=0', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillReps', 8);
    fixture.detectChanges();

    fixture.componentInstance.form.controls.weightKg.setValue(0);
    fixture.detectChanges();

    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[fg-button][type="submit"]');
    expect(btn).toBeTruthy();
    expect(btn!.disabled).toBe(true);
  });

  it('setLogged does NOT emit when weightKg=0 (submit guard)', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillReps', 8);
    fixture.detectChanges();

    const captured: LogSetInput[] = [];
    fixture.componentInstance.setLogged.subscribe((v: LogSetInput) => captured.push(v));

    // weight=0 → form invalid → submit should not emit
    fixture.componentInstance.form.controls.weightKg.setValue(0);
    fixture.componentInstance.onSubmit();

    expect(captured).toHaveLength(0);
  });

  // ── CLEAR-ZERO-ON-FOCUS ────────────────────────────────────────────────────

  describe('peso: el 0 inicial desaparece al enfocar', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('sessionId', 's-1');
      fixture.componentRef.setInput('exerciseId', 'ex-1');
      fixture.componentRef.setInput('trackingType', 'weight-reps');
      fixture.detectChanges();
    });

    it('onNumberFocus vacía el campo cuando vale 0', () => {
      fixture.componentInstance.form.controls.weightKg.setValue(0);
      fixture.componentInstance.onNumberFocus('weightKg');
      expect(fixture.componentInstance.form.controls.weightKg.value).toBeNull();
    });

    it('onNumberFocus NO toca un valor distinto de 0', () => {
      fixture.componentInstance.form.controls.weightKg.setValue(100);
      fixture.componentInstance.onNumberFocus('weightKg');
      expect(fixture.componentInstance.form.controls.weightKg.value).toBe(100);
    });

    it('onNumberBlur restaura 0 cuando se deja vacío', () => {
      fixture.componentInstance.form.controls.weightKg.setValue(null);
      fixture.componentInstance.onNumberBlur('weightKg');
      expect(fixture.componentInstance.form.controls.weightKg.value).toBe(0);
    });

    it('onNumberBlur respeta un peso real escrito', () => {
      fixture.componentInstance.form.controls.weightKg.setValue(82.5);
      fixture.componentInstance.onNumberBlur('weightKg');
      expect(fixture.componentInstance.form.controls.weightKg.value).toBe(82.5);
    });

    it('el input de peso dispara onNumberFocus al recibir focus (vacía el 0)', () => {
      fixture.componentInstance.form.controls.weightKg.setValue(0);
      const input = (fixture.nativeElement as HTMLElement).querySelector(
        'input[aria-label="Peso en kg"]',
      ) as HTMLInputElement;
      input.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      expect(fixture.componentInstance.form.controls.weightKg.value).toBeNull();
    });
  });

  // ── PREFILL TARGET TESTS ──────────────────────────────────────────────────

  it('prefillTarget weight-reps: form initialises with weightKg and reps from target', () => {
    const target: TargetSet = { type: 'weight-reps', reps: 5, weightKg: 100 };
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillTarget', target);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(100);
    expect(fixture.componentInstance.form.controls.reps.value).toBe(5);
  });

  it('prefillTarget bodyweight-reps: form initialises with extraWeightKg and reps from target', () => {
    const target: TargetSet = { type: 'bodyweight-reps', reps: 12, extraWeightKg: 10 };
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'bodyweight-reps');
    fixture.componentRef.setInput('prefillTarget', target);
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.extraWeightKg.value).toBe(10);
    expect(fixture.componentInstance.form.controls.reps.value).toBe(12);
  });

  it('prefillTarget guard: dirty form is NOT overwritten when prefillTarget changes', () => {
    const target: TargetSet = { type: 'weight-reps', reps: 5, weightKg: 100 };
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillTarget', target);
    fixture.detectChanges();

    // User types something (marks form dirty)
    fixture.componentInstance.form.controls.weightKg.setValue(75);
    fixture.componentInstance.form.markAsDirty();

    // Now prefillTarget changes
    const newTarget: TargetSet = { type: 'weight-reps', reps: 8, weightKg: 120 };
    fixture.componentRef.setInput('prefillTarget', newTarget);
    fixture.detectChanges();

    // Form should still have the user-typed value
    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(75);
  });

  it('after onSubmit, form resets to target values (not 0)', () => {
    const target: TargetSet = { type: 'weight-reps', reps: 5, weightKg: 100 };
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillTarget', target);
    fixture.detectChanges();

    fixture.componentInstance.form.patchValue({ weightKg: 100, reps: 5 });
    fixture.detectChanges();

    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(100);
    expect(fixture.componentInstance.form.controls.reps.value).toBe(5);
  });

  // ── PROGRESSION TARGET (slice 1: objetivo de doble progresión) ───────────

  describe('progressionTarget input', () => {
    it('does not render progression target section when input is null', () => {
      fixture.componentRef.setInput('sessionId', 's-1');
      fixture.componentRef.setInput('exerciseId', 'ex-1');
      fixture.componentRef.setInput('progressionTarget', null);
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).not.toContain('Objetivo');
    });

    it('renders "Objetivo hoy:" with formatted goal when progressionTarget is provided', () => {
      fixture.componentRef.setInput('sessionId', 's-1');
      fixture.componentRef.setInput('exerciseId', 'ex-1');
      fixture.componentRef.setInput('progressionTarget', '82.5kg × 8 (superá 80kg × 8)');
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Objetivo');
      expect(text).toContain('82.5kg × 8');
    });

    it('does not render progression target when in edit mode', () => {
      const editingSet: WorkedSet = {
        id: 'ws-edit',
        sessionId: 's-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        reps: { value: 8 } as never,
        weight: { value: 80 } as never,
        isPR: false,
        createdAt: new Date('2026-01-01'),
      };
      fixture.componentRef.setInput('sessionId', 's-1');
      fixture.componentRef.setInput('exerciseId', 'ex-1');
      fixture.componentRef.setInput('trackingType', 'weight-reps');
      fixture.componentRef.setInput('editSet', editingSet);
      fixture.componentRef.setInput('progressionTarget', '82.5kg × 8 (superá 80kg × 8)');
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).not.toContain('Objetivo');
    });
  });

  // ── EDIT MODE (slice 2: editar/borrar sets pasados) ───────────────────────

  describe('modo edición (editSet)', () => {
    const editingSet: WorkedSet = {
      id: 'ws-9',
      sessionId: 's-1',
      exerciseId: 'ex-1',
      type: 'weight-reps',
      reps: { value: 8 } as never,
      weight: { value: 80 } as never,
      isPR: false,
      createdAt: new Date('2026-01-01'),
    };

    function setupEdit(): void {
      fixture.componentRef.setInput('sessionId', 's-1');
      fixture.componentRef.setInput('exerciseId', 'ex-1');
      fixture.componentRef.setInput('trackingType', 'weight-reps');
      fixture.componentRef.setInput('editSet', editingSet);
      fixture.detectChanges();
    }

    it('prellena el form con reps y weightKg del set a editar', () => {
      setupEdit();
      expect(fixture.componentInstance.form.controls.weightKg.value).toBe(80);
      expect(fixture.componentInstance.form.controls.reps.value).toBe(8);
    });

    it('submit emite setEdited con el WorkedSet actualizado conservando el id', () => {
      setupEdit();
      const captured: WorkedSet[] = [];
      fixture.componentInstance.setEdited.subscribe((s: WorkedSet) => captured.push(s));

      fixture.componentInstance.form.patchValue({ reps: 12, weightKg: 100 });
      fixture.componentInstance.onSubmit();

      expect(captured).toHaveLength(1);
      expect(captured[0].id).toBe('ws-9');
      expect((captured[0] as { reps: { value: number } }).reps.value).toBe(12);
      expect((captured[0] as { weight: { value: number } }).weight.value).toBe(100);
    });

    it('en edición NO emite setLogged al hacer submit', () => {
      setupEdit();
      const logged: LogSetInput[] = [];
      fixture.componentInstance.setLogged.subscribe((v: LogSetInput) => logged.push(v));

      fixture.componentInstance.form.patchValue({ reps: 12, weightKg: 100 });
      fixture.componentInstance.onSubmit();

      expect(logged).toHaveLength(0);
    });

    it('el botón Borrar emite setRemoved con el id del set', () => {
      setupEdit();
      const removed: string[] = [];
      fixture.componentInstance.setRemoved.subscribe((id: string) => removed.push(id));

      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        'button[aria-label="Borrar set"]',
      );
      expect(btn).toBeTruthy();
      btn!.click();

      expect(removed).toEqual(['ws-9']);
    });

    it('el botón Cancelar emite editCancelled', () => {
      setupEdit();
      const cancelled: number[] = [];
      fixture.componentInstance.editCancelled.subscribe(() => cancelled.push(1));

      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        'button[aria-label="Cancelar edición"]',
      );
      expect(btn).toBeTruthy();
      btn!.click();

      expect(cancelled).toHaveLength(1);
    });

    it('muestra "Guardar" y no el texto de logueo', () => {
      setupEdit();
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Guardar');
      expect(text).not.toContain('Loguear set');
    });
  });
});
