/**
 * PrCelebrationComponent spec (D-3).
 * TDD strict — RED before implementation.
 * Tests unit input propagation through DisplayWeightPipe + the Cuaderno invariant:
 * the PR banner follows the accent color (accent-ink text, accent border), never
 * the old orange --pr-warm (supersedes ADR-33, rediseno-cuaderno T5).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrCelebrationComponent } from './pr-celebration.component';
import type { WorkedSet } from '../../domain/worked-set';

// Internal Angular component metadata exposed via the ɵcmp static field.
// Only the shape we read in R14 invariant tests is typed.
interface CompiledComponentMeta {
  readonly template?: (...args: unknown[]) => unknown;
  readonly styles?: readonly string[];
}

const weightRepsSet: WorkedSet = {
  id: 'ws-1',
  sessionId: 's-1',
  exerciseId: 'ex-1',
  type: 'weight-reps',
  reps: { value: 5 } as any,
  weight: { value: 100 } as any,
  isPR: true,
  createdAt: new Date('2026-01-01'),
};

describe('PrCelebrationComponent', () => {
  let fixture: ComponentFixture<PrCelebrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrCelebrationComponent],
    }).compileComponents();
  });

  // ── PRESERVED BEHAVIOUR TESTS ──────────────────────────────────────────────

  it('renders weight-reps PR with unit="kg" showing kg suffix', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'kg');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('100 kg');
  });

  it('renders weight-reps PR with unit="lb" showing lb value', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'lb');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('220.5 lb');
  });

  it('D4: a plates PR reads "N placas", never converted to lb nor suffixed with kg', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'lb');
    fixture.componentRef.setInput('weightUnit', 'plates');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = { ...weightRepsSet, weight: { value: 7 } as any };
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('7 placas · 5 reps');
    expect(text).not.toMatch(/\bkg\b|\blb\b/);
  });

  it('D4: a plates PR of a single plate reads "1 placa"', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('weightUnit', 'plates');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = { ...weightRepsSet, weight: { value: 1 } as any };
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('1 placa · 5 reps');
  });

  it('dismissed output emits when dismiss button is clicked', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'kg');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    let emitted = false;
    fixture.componentInstance.dismissed.subscribe(() => (emitted = true));
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Cerrar"]');
    expect(btn).toBeTruthy();
    btn!.click();
    expect(emitted).toBe(true);
  });

  // ── VISUAL REDESIGN TESTS (D-3) ────────────────────────────────────────────

  it('banner wrapper is a surface card with an accent border', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const wrapper = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.bg-surface.border-accent');
    expect(wrapper).toBeTruthy();
  });

  it('shows the exercise name and the numbers in mono', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('exerciseName', 'Sentadilla');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sentadilla');
    const mono = el.querySelector<HTMLElement>('.font-mono');
    expect(mono?.textContent).toContain('100 kg');
  });

  it('flame icon is present inside icon container', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const flameIcon = Array.from(el.querySelectorAll('fg-icon')).find(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'flame',
    );
    expect(flameIcon).toBeTruthy();
  });

  it('dismiss X icon is present', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const xIcon = Array.from(el.querySelectorAll('fg-icon')).find(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'x',
    );
    expect(xIcon).toBeTruthy();
  });

  it('banner shows "NUEVO PR" text', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('NUEVO PR');
  });

  // ── CUADERNO INVARIANT: acento, no naranja brasa ──────────────────────────

  it('SOURCE: template has no --pr-warm, forge-* nor legacy --accent-* references', () => {
    // After TestBed.configureTestingModule (in beforeEach), ɵcmp is compiled and available.
    // Access the JIT-compiled template function source as a proxy for template content.
    const meta = (PrCelebrationComponent as unknown as { ɵcmp?: CompiledComponentMeta }).ɵcmp;
    const templateFnStr = meta?.template?.toString() ?? '';
    // Must NOT be empty (guard that the template was actually compiled)
    expect(templateFnStr.length).toBeGreaterThan(0);
    expect(templateFnStr).not.toMatch(/pr-warm/);
    expect(templateFnStr).not.toMatch(/\bforge-\d/);
    expect(templateFnStr).not.toMatch(/--accent-/);
  });

  it('SOURCE: component styles do not reference --pr-warm', () => {
    const meta = (PrCelebrationComponent as unknown as { ɵcmp?: CompiledComponentMeta }).ɵcmp;
    const styles = (meta?.styles ?? []).join('\n');
    expect(styles).not.toMatch(/pr-warm/);
  });

  it('DOM: no element carries a --pr-warm inline style, a forge-* class or a raw hex', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const allEls = (fixture.nativeElement as HTMLElement).querySelectorAll('*');
    let offending = false;
    for (const el of Array.from(allEls)) {
      const style = (el as HTMLElement).getAttribute('style') ?? '';
      const cls = String((el as HTMLElement).getAttribute('class') ?? '');
      if (/pr-warm/.test(style) || /#[0-9a-fA-F]{6}\b/.test(style)) offending = true;
      if (/\bforge-\d/.test(cls)) offending = true;
    }
    expect(offending).toBe(false);
  });

  it('DOM: the title is accent-ink and the flame sits on a solid accent square', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.text-accent-ink')?.textContent).toContain('NUEVO PR');
    const flame = Array.from(el.querySelectorAll('fg-icon')).find(
      (ic) => (ic as HTMLElement).getAttribute('name') === 'flame',
    );
    expect(flame?.closest('.bg-accent')).toBeTruthy();
  });
});
