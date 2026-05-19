/**
 * SetLoggerComponent spec (D-1, ADR-34).
 * TDD strict — RED before implementation.
 * Tests preserved API behaviour + visual redesign (fg-card, NumericStepper inline, fg-button).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SetLoggerComponent } from './set-logger.component';
import type { LogSetInput } from '../../domain/use-cases/log-set.use-case';

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

  it('NumericStepper weight — decrement button decreases weightKg by 2.5', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillWeightKg', 80);
    fixture.detectChanges();

    // Click the dec button for weight (first minus button in the grid)
    const stepperBtns = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Disminuir peso"]');
    expect(stepperBtns.length).toBeGreaterThan(0);
    (stepperBtns[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(77.5);
  });

  it('NumericStepper weight — increment button increases weightKg by 2.5', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillWeightKg', 80);
    fixture.detectChanges();

    const incBtns = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Aumentar peso"]');
    expect(incBtns.length).toBeGreaterThan(0);
    (incBtns[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.weightKg.value).toBe(82.5);
  });

  it('NumericStepper reps — increment button increases reps by 1', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('prefillReps', 8);
    fixture.detectChanges();

    const incBtns = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Aumentar reps"]');
    expect(incBtns.length).toBeGreaterThan(0);
    (incBtns[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.reps.value).toBe(9);
  });

  it('NumericStepper reps — decrement does not go below 0', () => {
    fixture.componentRef.setInput('sessionId', 's-1');
    fixture.componentRef.setInput('exerciseId', 'ex-1');
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();

    // value starts at 0
    const decBtns = (fixture.nativeElement as HTMLElement).querySelectorAll('button[aria-label="Disminuir reps"]');
    (decBtns[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.reps.value).toBe(0);
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
});
