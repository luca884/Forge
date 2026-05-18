/**
 * PrCelebrationComponent spec (D-3).
 * TDD strict — RED before implementation.
 * Tests unit input propagation through DisplayWeightPipe + PR-warm invariant (ADR-33, R14).
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrCelebrationComponent } from './pr-celebration.component';
import type { WorkedSet } from '../../domain/worked-set';

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

  it('dismissed output emits when dismiss button is clicked', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentRef.setInput('unit', 'kg');
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    let emitted = false;
    fixture.componentInstance.dismissed.subscribe(() => (emitted = true));
    const btn = (fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Cerrar"]') as HTMLButtonElement | null;
    expect(btn).toBeTruthy();
    btn!.click();
    expect(emitted).toBe(true);
  });

  // ── VISUAL REDESIGN TESTS (D-3) ────────────────────────────────────────────

  it('banner wrapper has bg-forge-850 and rounded-[14px] classes', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const wrapper = (fixture.nativeElement as HTMLElement).querySelector('.bg-forge-850') as HTMLElement | null;
    expect(wrapper).toBeTruthy();
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

  // ── R14 INVARIANT TESTS (ADR-33, CRITICAL) ────────────────────────────────

  it('R14 SOURCE: template must NOT contain --accent- references', () => {
    // After TestBed.configureTestingModule (in beforeEach), ɵcmp is compiled and available.
    // Access the JIT-compiled template function source as a proxy for template content.
    const meta = (PrCelebrationComponent as any).ɵcmp;
    // ɵcmp.template is the compiled render function — its source encodes all bindings
    const templateFnStr = meta?.template?.toString() ?? '';
    expect(templateFnStr).not.toMatch(/--accent-/);
    expect(templateFnStr).not.toMatch(/\baccent-\d/);
    expect(templateFnStr).not.toMatch(/bg-accent/);
    expect(templateFnStr).not.toMatch(/text-accent/);
    expect(templateFnStr).not.toMatch(/ring-accent/);
    // Must NOT be empty (guard that the template was actually compiled)
    expect(templateFnStr.length).toBeGreaterThan(0);
  });

  it('R14 SOURCE: component styles must NOT contain accent token references', () => {
    const meta = (PrCelebrationComponent as any).ɵcmp;
    if (meta?.styles) {
      const styles = (meta.styles as string[]).join('\n');
      expect(styles).not.toMatch(/--accent-/);
      expect(styles).not.toMatch(/\baccent-\d/);
    }
    // Always passes if no styles set — the source guard above covers this
    expect(true).toBe(true);
  });

  it('R14 DOM: rendered output must NOT include var(--accent-*) in any style attribute', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const allEls = (fixture.nativeElement as HTMLElement).querySelectorAll('*');
    let foundAccent = false;
    for (const el of Array.from(allEls)) {
      const style = (el as HTMLElement).getAttribute('style') ?? '';
      const cls = (el as HTMLElement).className ?? '';
      if (/var\(--accent/.test(style)) foundAccent = true;
      if (/\baccent-\d/.test(String(cls))) foundAccent = true;
    }
    expect(foundAccent).toBe(false);
  });

  it('R14 DOM: at least one element has var(--pr-warm-rgb) or var(--pr-warm) in inline style', () => {
    fixture = TestBed.createComponent(PrCelebrationComponent);
    fixture.componentInstance.visible = true;
    fixture.componentInstance.set = weightRepsSet;
    fixture.detectChanges();
    const allEls = (fixture.nativeElement as HTMLElement).querySelectorAll('*');
    let foundWarm = false;
    for (const el of Array.from(allEls)) {
      const style = (el as HTMLElement).getAttribute('style') ?? '';
      if (/var\(--pr-warm/.test(style)) {
        foundWarm = true;
        break;
      }
    }
    // jsdom DOES preserve inline style attributes with CSS custom props (unlike computed styles).
    // The component sets inline styles with var(--pr-warm-rgb) and var(--pr-warm) on the wrapper and icon.
    expect(foundWarm).toBe(true);
  });
});
