import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionHeatmapComponent } from './session-heatmap.component';

describe('SessionHeatmapComponent', () => {
  let fixture: ComponentFixture<SessionHeatmapComponent>;
  let component: SessionHeatmapComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionHeatmapComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SessionHeatmapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  // ── Cell count ───────────────────────────────────────────────────────────
  it('renders 84 cells by default (12 weeks × 7 days)', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cells = el.querySelectorAll<HTMLDivElement>('.heatmap__cell');
    expect(cells.length).toBe(84);
  });

  // ── R15: count=0 cells use bg-forge-850 + ring — NO bg-forge-800 / bg-green-* ──
  it('count=0 cell does NOT have bg-forge-800 class (R15)', () => {
    // All cells are count=0 by default (empty heatmapData)
    const el = fixture.nativeElement as HTMLElement;
    const cells = el.querySelectorAll<HTMLDivElement>('.heatmap__cell');
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach(cell => {
      expect(cell.classList.contains('bg-forge-800')).toBe(false);
    });
  });

  it('count=0 cell does NOT have bg-green-* class (R15)', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cells = el.querySelectorAll<HTMLDivElement>('.heatmap__cell');
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach(cell => {
      expect(cell.className).not.toMatch(/bg-green-/);
    });
  });

  it('count=0 cell has ring-zero class for inset ring styling', () => {
    const el = fixture.nativeElement as HTMLElement;
    // All cells are count=0 with empty heatmapData
    const cells = el.querySelectorAll<HTMLDivElement>('.heatmap__cell');
    expect(cells.length).toBeGreaterThan(0);
    // Every cell with count=0 should have the ring-zero class
    cells.forEach(cell => {
      expect(cell.classList.contains('ring-zero')).toBe(true);
    });
  });

  // ── R15: count>0 cells use rgba(var(--accent-rgb), ...) — verified via cellBg() method ──
  // NOTE: jsdom does not process CSS variables in inline styles — style.background and
  // getAttribute('style') both return empty/null for values containing var(...).
  // We verify the method output directly (unit-level) and check the DOM reflects count data.
  it('cellBg(count>0) returns rgba(var(--accent-rgb),...) — method verified (R15)', () => {
    const result = component.cellBg(3);
    // Method returns the string that Angular binds to [style.background]
    expect(result).toMatch(/rgba\(var\(--accent-rgb\)/);
  });

  it('count>0 cell does NOT have bg-green-* class (R15)', () => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');
    const data = new Map([[todayKey, 2]]);
    fixture.componentRef.setInput('heatmapData', data);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const cells = el.querySelectorAll<HTMLDivElement>('.heatmap__cell');
    cells.forEach(cell => {
      expect(cell.className).not.toMatch(/bg-green-/);
    });
  });

  it('count>0 cell does NOT have ring-zero class (not empty)', () => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');
    const data = new Map([[todayKey, 3]]);
    fixture.componentRef.setInput('heatmapData', data);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const cells = el.querySelectorAll<HTMLDivElement>('.heatmap__cell');
    // todayCell is the last one (cells are ordered oldest→newest)
    const todayCellInDom = cells[cells.length - 1] as HTMLDivElement | undefined;
    expect(todayCellInDom).toBeDefined();
    expect(todayCellInDom!.classList.contains('ring-zero')).toBe(false);
  });

  // ── Legend ───────────────────────────────────────────────────────────────
  it('legend renders 4 swatches', () => {
    const el = fixture.nativeElement as HTMLElement;
    const legendSwatches = el.querySelectorAll<HTMLDivElement>('.heatmap__legend-swatch');
    expect(legendSwatches.length).toBe(4);
  });

  it('legendBg() returns rgba(var(--accent-rgb),...) for each alpha — method verified', () => {
    // Verify the method output (what gets bound to [style.background])
    const alphas = [0.15, 0.4, 0.65, 1] as const;
    alphas.forEach(a => {
      expect(component.legendBg(a)).toMatch(/rgba\(var\(--accent-rgb\)/);
    });
  });

  it('legend has "menos" and "más" text', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('menos');
    expect(el.textContent).toContain('más');
  });

  // ── Footer labels ────────────────────────────────────────────────────────
  it('footer shows "hace 12 semanas" and "hoy"', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('hace 12 semanas');
    expect(el.textContent).toContain('hoy');
  });

  // ── Tooltip (PRESERVED) ──────────────────────────────────────────────────
  it('tooltip shows date and session count', () => {
    const cell = { date: '2026-05-15', count: 2, label: '15 de mayo de 2026' };
    expect(component.tooltip(cell)).toBe('15 de mayo de 2026 • 2 sesiones');
  });

  it('tooltip uses singular "sesión" for count 1', () => {
    const cell = { date: '2026-05-15', count: 1, label: '15 de mayo de 2026' };
    expect(component.tooltip(cell)).toBe('15 de mayo de 2026 • 1 sesión');
  });

  // ── heatmapData integration (PRESERVED) ─────────────────────────────────
  it('cells reflect heatmapData counts', () => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');
    const data = new Map([[todayKey, 3]]);
    fixture.componentRef.setInput('heatmapData', data);
    fixture.detectChanges();

    const todayCell = component.cells.find(c => c.date === todayKey);
    expect(todayCell).toBeDefined();
    expect(todayCell!.count).toBe(3);
  });

  // ── cellBg method: alpha formula ─────────────────────────────────────────
  it('cellBg(0) returns undefined (no inline style for empty cells)', () => {
    expect(component.cellBg(0)).toBeUndefined();
  });

  it('cellBg(count>0) returns rgba string with correct alpha formula', () => {
    // With heatmapData empty (maxCount=1), count=1 → intensity=1 → alpha=1.0
    const result = component.cellBg(1);
    expect(result).toMatch(/rgba\(var\(--accent-rgb\), 1\.00\)/);
  });

  it('cellBg uses relative intensity: low count → lower alpha', () => {
    // Set up data so maxCount=3: count=1 → intensity=0.333 → alpha=0.18+0.333*0.82≈0.45
    const data = new Map([
      ['2026-01-01', 3],
      ['2026-01-02', 1],
    ]);
    fixture.componentRef.setInput('heatmapData', data);
    fixture.detectChanges();

    const lowCountResult = component.cellBg(1);
    const highCountResult = component.cellBg(3);
    // Both should contain rgba(var(--accent-rgb),
    expect(lowCountResult).toMatch(/rgba\(var\(--accent-rgb\)/);
    expect(highCountResult).toMatch(/rgba\(var\(--accent-rgb\)/);
    // High count should have higher alpha (closer to 1) than low count
    const extractAlpha = (s: string) => parseFloat(s.match(/[\d.]+\)$/)?.[0] ?? '0');
    expect(extractAlpha(highCountResult!)).toBeGreaterThan(extractAlpha(lowCountResult!));
  });
});
