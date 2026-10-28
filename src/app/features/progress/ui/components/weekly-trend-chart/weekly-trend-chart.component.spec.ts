import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeeklyTrendChartComponent } from './weekly-trend-chart.component';

describe('WeeklyTrendChartComponent', () => {
  let fixture: ComponentFixture<WeeklyTrendChartComponent>;

  const points = [
    { weekStart: '2026-07-13', volumeKg: 500, sessions: 2 },
    { weekStart: '2026-07-20', volumeKg: 250, sessions: 1 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WeeklyTrendChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(WeeklyTrendChartComponent);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('renders an empty state without points', () => {
    fixture.componentRef.setInput('points', []);
    fixture.detectChanges();

    expect(el().textContent).toContain('Todavía no hay volumen semanal');
  });

  it('draws the volume and the sessions as two bar charts, one bar per week, without a canvas', () => {
    fixture.componentRef.setInput('points', points);
    fixture.detectChanges();

    const charts = el().querySelectorAll('[role="img"]');
    expect(charts).toHaveLength(2);
    expect(el().querySelectorAll('[data-bar]')).toHaveLength(4);
    expect(el().querySelector('canvas')).toBeNull();
    expect(el().textContent).toContain('Volumen semanal');
    expect(el().textContent).toContain('Sesiones semanales');
  });

  it('scales each bar against a round axis maximum', () => {
    fixture.componentRef.setInput('points', points);
    fixture.detectChanges();

    const volume = fixture.componentInstance.volumeChart();
    expect(volume.ticks).toEqual([500, 250, 0]);
    expect(volume.bars.map((b) => b.heightPct)).toEqual([100, 50]);
  });

  it('keeps the sessions axis on whole numbers', () => {
    fixture.componentRef.setInput('points', [
      { weekStart: '2026-07-13', volumeKg: 500, sessions: 3 },
      { weekStart: '2026-07-20', volumeKg: 250, sessions: 1 },
    ]);
    fixture.detectChanges();

    const sessions = fixture.componentInstance.sessionChart();
    expect(sessions.ticks).toEqual([4, 2, 0]);
    expect(sessions.bars.map((b) => b.heightPct)).toEqual([75, 25]);
  });

  it('keeps a readable axis while there is no data yet', () => {
    fixture.componentRef.setInput('points', [{ weekStart: '2026-07-13', volumeKg: 0, sessions: 0 }]);
    fixture.detectChanges();

    expect(fixture.componentInstance.volumeChart().ticks).toEqual([10, 5, 0]);
    expect(fixture.componentInstance.volumeChart().bars.map((b) => b.heightPct)).toEqual([0]);
  });

  it('labels every third week and the last one, as d/m', () => {
    const weeks = ['2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03'].map((weekStart) => ({
      weekStart,
      volumeKg: 100,
      sessions: 1,
    }));
    fixture.componentRef.setInput('points', weeks);
    fixture.detectChanges();

    expect(fixture.componentInstance.volumeChart().bars.map((b) => b.label)).toEqual(['6/7', '', '', '27/7', '3/8']);
  });

  it('marks the week in progress with a lighter bar', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-22T12:00:00'));
    fixture.componentRef.setInput('points', points);
    fixture.detectChanges();

    expect(fixture.componentInstance.volumeChart().bars.map((b) => b.current)).toEqual([false, true]);
  });

  describe('unit', () => {
    it('shows the average and the aria label in kg by default', () => {
      fixture.componentRef.setInput('points', points);
      fixture.detectChanges();

      expect(el().textContent).toContain('promedio 375 kg');
      const label = el().querySelectorAll('[role="img"]')[0]!.getAttribute('aria-label');
      expect(label).toContain('entre 250 y 500 kg');
    });

    it('converts the average, the axis and the aria label to lb (DisplayWeightPipe rules)', () => {
      fixture.componentRef.setInput('points', points);
      fixture.componentRef.setInput('unit', 'lb');
      fixture.detectChanges();

      expect(el().textContent).toContain('promedio 826.7 lb');
      expect(fixture.componentInstance.volumeChart().ticks).toEqual([1200, 600, 0]);
      const label = el().querySelectorAll('[role="img"]')[0]!.getAttribute('aria-label');
      expect(label).toContain('entre 551.2 y 1102.3 lb');
      expect(el().textContent).not.toContain(' kg');
    });
  });
});
