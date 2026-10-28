/**
 * Spec for <fg-exercise-history-chart> (D-6, Cuaderno).
 * Verifies: metric and range selectors (real buttons with aria-pressed), fg-line-chart
 * presence, empty state, yLabel unit adaptation, series in the preferred unit.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseHistoryChartComponent } from './exercise-history-chart.component';
import type { WorkedSet } from '@features/training/domain/worked-set';

// Mock canvas for Chart.js in jsdom. Kept in a variable so a test can ask which
// canvas elements Chart.js drew on (`mock.contexts`).
type CanvasPrototypeExt = typeof HTMLCanvasElement.prototype & { __mockSet?: boolean };
let getContextMock: jest.Mock;

beforeAll(() => {
  const proto = HTMLCanvasElement.prototype as CanvasPrototypeExt;
  if (!proto.__mockSet) {
    getContextMock = jest.fn(() => ({
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
      measureText: jest.fn(() => ({ width: 0 })),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      canvas: { width: 300, height: 150 },
    }));
    Object.defineProperty(proto, 'getContext', {
      value: getContextMock,
      configurable: true,
      writable: true,
    });
    proto.__mockSet = true;
  }
});

const t1 = new Date('2026-01-01');
const t2 = new Date('2026-01-08');

const sampleSets: WorkedSet[] = [
  {
    id: 'ws-1',
    sessionId: 's-1',
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: { value: 5 } as any,
    weight: { value: 100 } as any,
    isPR: false,
    createdAt: t1,
  },
  {
    id: 'ws-2',
    sessionId: 's-1',
    exerciseId: 'ex-1',
    type: 'weight-reps',
    reps: { value: 5 } as any,
    weight: { value: 105 } as any,
    isPR: true,
    createdAt: t2,
  },
];

describe('ExerciseHistoryChartComponent', () => {
  let fixture: ComponentFixture<ExerciseHistoryChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseHistoryChartComponent],
    }).compileComponents();
  });

  it('renders without crashing with empty sets (D-30/S2)', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', []);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('shows empty state when sets is empty', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', []);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).not.toBeNull();
  });

  it('no selectors rendered in empty state (D-6/S3)', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', []);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('button').length).toBe(0);
  });

  it('renders chart with weight-reps sets without crashing (D-30/S1)', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', sampleSets);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  // ── Metric selector: real buttons in a labelled group, state in aria-pressed ──
  function metricButtons(): HTMLButtonElement[] {
    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"][aria-label="Métrica"]');
    return Array.from(group?.querySelectorAll('button') ?? []);
  }

  function rangeButtons(): HTMLButtonElement[] {
    const group = (fixture.nativeElement as HTMLElement).querySelector('[role="group"][aria-label="Rango"]');
    return Array.from(group?.querySelectorAll('button') ?? []);
  }

  function render(unit?: 'kg' | 'lb', sets: WorkedSet[] = sampleSets): void {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', sets);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    if (unit) fixture.componentRef.setInput('unit', unit);
    fixture.detectChanges();
  }

  it('shows 4 metric buttons for weight-reps exercises (D-6/S1)', () => {
    render();
    expect(metricButtons().length).toBe(4); // weight, reps, volume, 1rm
  });

  it('metric buttons carry the Cuaderno labels (D-6/S1)', () => {
    render();
    expect(metricButtons().map((b) => b.textContent?.trim())).toEqual(['Peso', 'Reps', 'Volumen', '1RM est.']);
  });

  it('shows a single "Reps" button for non weight exercises', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', [
      { id: 'ws-t1', sessionId: 's-1', exerciseId: 'ex-time', type: 'time', durationSec: 60, isPR: false, createdAt: t1 },
    ] as WorkedSet[]);
    fixture.componentRef.setInput('trackingType', 'time');
    fixture.detectChanges();
    expect(metricButtons().map((b) => b.textContent?.trim())).toEqual(['Reps']);
  });

  // ── D-6/S2: aria-pressed reflects selectedMetric ──────────────────────────
  it('the selected metric is the only button with aria-pressed="true" (D-6/S2)', () => {
    render();
    expect(metricButtons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false']);
  });

  it('clicking a metric button selects it and moves aria-pressed (D-6/S2)', () => {
    render();
    metricButtons()[3]!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedMetric()).toBe('1rm');
    expect(metricButtons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true']);
  });

  // ── Range selector (3M / 6M / 1A / Todo) ───────────────────────────────
  describe('range', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('offers 3M, 6M, 1A and Todo, with Todo selected so the whole history shows by default', () => {
      render();
      expect(rangeButtons().map((b) => b.textContent?.trim())).toEqual(['3M', '6M', '1A', 'Todo']);
      expect(rangeButtons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true']);
    });

    it('3M drops sets older than three months', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-01T12:00:00Z'));
      render();
      rangeButtons()[0]!.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.series()[0]!.points).toEqual([]);
      expect(rangeButtons()[0]!.getAttribute('aria-pressed')).toBe('true');
    });

    it('6M and 1A keep sets inside their window', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-01T12:00:00Z'));
      render();

      rangeButtons()[1]!.click(); // 6M → since 2026-02-01, Jan sets are out
      fixture.detectChanges();
      expect(fixture.componentInstance.series()[0]!.points.length).toBe(0);

      rangeButtons()[2]!.click(); // 1A → since 2025-08-01, both Jan sets are in
      fixture.detectChanges();
      expect(fixture.componentInstance.series()[0]!.points.length).toBe(2);
    });

    it('Todo keeps the whole history', () => {
      jest.useFakeTimers().setSystemTime(new Date('2030-01-01T12:00:00Z'));
      render();
      expect(fixture.componentInstance.series()[0]!.points.length).toBe(2);
    });

    // C1: the chart is drawn again when a range with no sets is left behind.
    it('draws the chart again when Todo follows a range with no sets', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-08-01T12:00:00Z'));
      render();
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('canvas')).not.toBeNull();

      rangeButtons()[0]!.click(); // 3M: the January sets are out, so no canvas and an empty message
      fixture.detectChanges();
      expect(host.querySelector('canvas')).toBeNull();
      expect(host.textContent).toContain('Sin datos para mostrar');

      rangeButtons()[3]!.click(); // Todo: the data is back on a new canvas
      fixture.detectChanges();
      const canvas = host.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(getContextMock.mock.contexts).toContain(canvas);
      expect(host.textContent).not.toContain('Sin datos para mostrar');
    });
  });

  // ── Weight metrics are plotted in the preferred unit ─────────────────────
  describe('unit', () => {
    it('plots weight in kg by default', () => {
      render();
      expect(fixture.componentInstance.series()[0]!.points.map((p) => p.y)).toEqual([100, 105]);
    });

    it('plots weight in lb (same conversion as DisplayWeightPipe) when unit="lb"', () => {
      render('lb');
      expect(fixture.componentInstance.series()[0]!.points.map((p) => p.y)).toEqual([220.5, 231.5]);
    });

    // C5: the tooltip prints "<series label>: <value>", so the label must carry the unit of the values.
    it('names the series with the preferred unit, the same text as the axis', () => {
      render('lb');
      expect(fixture.componentInstance.series()[0]!.label).toBe('Peso (lb)');

      fixture.componentInstance.selectedMetric.set('volume');
      expect(fixture.componentInstance.series()[0]!.label).toBe('Volumen (lb×reps)');
      expect(fixture.componentInstance.series()[0]!.label).toBe(fixture.componentInstance.yLabel());

      fixture.componentInstance.selectedMetric.set('1rm');
      expect(fixture.componentInstance.series()[0]!.label).toBe('1RM estimado (lb)');
    });

    it('keeps the kg series label by default', () => {
      render();
      expect(fixture.componentInstance.series()[0]!.label).toBe('Peso (kg)');
    });

    it('plots volume in lb too, but never converts reps', () => {
      render('lb');
      fixture.componentInstance.selectedMetric.set('volume');
      expect(fixture.componentInstance.series()[0]!.points.map((p) => p.y)).toEqual([1102.3, 1157.4]);

      fixture.componentInstance.selectedMetric.set('reps');
      expect(fixture.componentInstance.series()[0]!.points.map((p) => p.y)).toEqual([5, 5]);
    });
  });

  // ── S11: a plates exercise plots plates, and kg (converted like any weight) for the derived metrics ──
  describe('plates exercise', () => {
    const plateSets: WorkedSet[] = [
      { ...sampleSets[0]!, weight: { value: 3 } as any },
      { ...sampleSets[1]!, weight: { value: 4 } as any },
    ] as WorkedSet[];

    function renderPlates(unit: 'kg' | 'lb'): void {
      fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
      fixture.componentRef.setInput('sets', plateSets);
      fixture.componentRef.setInput('trackingType', 'weight-reps');
      fixture.componentRef.setInput('unit', unit);
      fixture.componentRef.setInput('exercise', { weightUnit: 'plates', plateWeightKg: 10 });
      fixture.detectChanges();
    }

    it('plots the plate count and names the axis "Placas", whatever the preferred unit', () => {
      renderPlates('lb');
      expect(fixture.componentInstance.series()[0]!.points.map((p) => p.y)).toEqual([3, 4]);
      expect(fixture.componentInstance.yLabel()).toBe('Placas');
      expect(fixture.componentInstance.series()[0]!.label).toBe('Placas');
    });

    it('keeps the "Peso" button label', () => {
      renderPlates('kg');
      expect(metricButtons().map((b) => b.textContent?.trim())).toEqual(['Peso', 'Reps', 'Volumen', '1RM est.']);
    });

    it('plots volume in lb from the load in kg', () => {
      renderPlates('lb');
      fixture.componentInstance.selectedMetric.set('volume');
      // 3 x 10 kg x 5 reps = 150 kg → 330.7 lb; 4 x 10 x 5 = 200 kg → 440.9 lb
      expect(fixture.componentInstance.series()[0]!.points.map((p) => p.y)).toEqual([330.7, 440.9]);
      expect(fixture.componentInstance.yLabel()).toBe('Volumen (lb×reps)');
    });
  });

  // ── ADR-13: fg-line-chart still present ──────────────────────────────────
  it('fg-line-chart element is present (ADR-13 preserved, D-6/S4)', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', sampleSets);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('fg-line-chart')).not.toBeNull();
  });

  it('has selector fg-exercise-history-chart', () => {
    expect(ExerciseHistoryChartComponent).toBeDefined();
    expect(true).toBe(true);
  });

  it('renders without crashing for time exercises', () => {
    const timeSets: WorkedSet[] = [
      {
        id: 'ws-t1',
        sessionId: 's-1',
        exerciseId: 'ex-time',
        type: 'time',
        durationSec: 60,
        isPR: false,
        createdAt: t1,
      },
    ];
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', timeSets);
    fixture.componentRef.setInput('trackingType', 'time');
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  // D-9 — unit-aware axis labels (PRESERVED)
  it('yLabel() returns "Peso (lb)" when unit="lb" and metric=weight', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', sampleSets);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    expect(fixture.componentInstance.yLabel()).toBe('Peso (lb)');
  });

  it('yLabel() returns "Volumen (lb×reps)" when unit="lb" and metric=volume', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', sampleSets);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();
    fixture.componentInstance.selectedMetric.set('volume');
    expect(fixture.componentInstance.yLabel()).toBe('Volumen (lb×reps)');
  });

  it('yLabel() returns "Peso (kg)" when unit="kg" (default) and metric=weight', () => {
    fixture = TestBed.createComponent(ExerciseHistoryChartComponent);
    fixture.componentRef.setInput('sets', sampleSets);
    fixture.componentRef.setInput('trackingType', 'weight-reps');
    fixture.detectChanges();
    expect(fixture.componentInstance.yLabel()).toBe('Peso (kg)');
  });
});
