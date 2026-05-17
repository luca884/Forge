import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ICONS } from './icon.catalog';
import { FgIconComponent } from './icon.component';

describe('FgIconComponent', () => {
  let fixture: ComponentFixture<FgIconComponent>;

  function createWithInputs(inputs: { name: string; size?: number; strokeWidth?: number }): void {
    fixture = TestBed.createComponent(FgIconComponent);
    fixture.componentRef.setInput('name', inputs.name);
    if (inputs.size !== undefined) fixture.componentRef.setInput('size', inputs.size);
    if (inputs.strokeWidth !== undefined) fixture.componentRef.setInput('strokeWidth', inputs.strokeWidth);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FgIconComponent],
    }).compileComponents();
  });

  it('componente standalone se renderiza (selector fg-icon)', () => {
    fixture = TestBed.createComponent(FgIconComponent);
    fixture.componentRef.setInput('name', 'check');
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('renders correct SVG for a known icon (check)', () => {
    beforeEach(() => createWithInputs({ name: 'check' }));

    it('renders exactly 1 <svg> element', () => {
      const svgs = fixture.debugElement.queryAll(By.css('svg'));
      expect(svgs.length).toBe(1);
    });

    it('<svg> has viewBox="0 0 24 24"', () => {
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('<svg> has fill="none"', () => {
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('fill')).toBe('none');
    });

    it('<svg> has stroke="currentColor"', () => {
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('stroke')).toBe('currentColor');
    });

    it('<svg> has stroke-width="1.75" by default', () => {
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('stroke-width')).toBe('1.75');
    });

    it('renders at least one <path> with the correct d attribute', () => {
      const paths = fixture.debugElement.queryAll(By.css('svg path'));
      expect(paths.length).toBeGreaterThanOrEqual(1);
      const rawPath = ICONS['check'];
      const expectedPaths = rawPath.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
      const renderedDs = paths.map((p) => (p.nativeElement as SVGPathElement).getAttribute('d'));
      expectedPaths.forEach((expected) => {
        expect(renderedDs).toContain(expected);
      });
    });
  });

  describe('multi-path icon (dumbbell) renders multiple <path> elements', () => {
    beforeEach(() => createWithInputs({ name: 'dumbbell' }));

    it('renders more than one <path> for a multi-path icon', () => {
      const paths = fixture.debugElement.queryAll(By.css('svg path'));
      expect(paths.length).toBeGreaterThan(1);
    });
  });

  describe('size input', () => {
    it('default size is 20 (width and height)', () => {
      createWithInputs({ name: 'plus' });
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('width')).toBe('20');
      expect(svg.getAttribute('height')).toBe('20');
    });

    it('size=24 sets width=24 and height=24', () => {
      createWithInputs({ name: 'plus', size: 24 });
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('width')).toBe('24');
      expect(svg.getAttribute('height')).toBe('24');
    });
  });

  describe('strokeWidth input', () => {
    it('default strokeWidth is 1.75', () => {
      createWithInputs({ name: 'plus' });
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('stroke-width')).toBe('1.75');
    });

    it('strokeWidth=2 sets stroke-width="2"', () => {
      createWithInputs({ name: 'plus', strokeWidth: 2 });
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('stroke-width')).toBe('2');
    });
  });

  describe('unknown icon name (runtime fallback) — DOM behavior', () => {
    beforeEach(() => {
      createWithInputs({ name: 'nope-icon-does-not-exist' });
    });

    it('does NOT render an <svg> element', () => {
      const svgs = fixture.debugElement.queryAll(By.css('svg'));
      expect(svgs.length).toBe(0);
    });

    it('renders a <span data-icon-placeholder> element', () => {
      const placeholder = fixture.debugElement.query(By.css('[data-icon-placeholder]'));
      expect(placeholder).toBeTruthy();
    });
  });

  /**
   * Warn behavior is tested in isolation to avoid module-level warnedNames Set
   * interference between test cases. Each test uses a unique icon name to ensure
   * the Set hasn't seen it before in this test run.
   */
  describe('unknown icon name (runtime fallback) — warn behavior', () => {
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('calls console.warn once (in devMode) with the unknown name on first render', () => {
      const uniqueName = `test-unknown-icon-warn-${Date.now()}`;
      createWithInputs({ name: uniqueName });
      TestBed.flushEffects();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(uniqueName)
      );
    });

    it('does not warn again for the same unknown name on repeated detectChanges', () => {
      const uniqueName = `test-unknown-icon-nodupe-${Date.now()}`;
      createWithInputs({ name: uniqueName });
      TestBed.flushEffects();
      const callCountAfterFirst = warnSpy.mock.calls.length;

      // Trigger multiple re-renders — no additional warns should fire
      fixture.detectChanges();
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(warnSpy).toHaveBeenCalledTimes(callCountAfterFirst);
    });
  });

  describe('accessibility', () => {
    beforeEach(() => createWithInputs({ name: 'check' }));

    it('<svg> has aria-hidden="true"', () => {
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    it('<svg> has focusable="false"', () => {
      const svg = fixture.debugElement.query(By.css('svg')).nativeElement as SVGElement;
      expect(svg.getAttribute('focusable')).toBe('false');
    });
  });
});
