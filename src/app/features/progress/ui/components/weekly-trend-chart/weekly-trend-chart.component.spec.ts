import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WeeklyTrendChartComponent } from './weekly-trend-chart.component';

describe('WeeklyTrendChartComponent', () => {
  let fixture: ComponentFixture<WeeklyTrendChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WeeklyTrendChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(WeeklyTrendChartComponent);
  });

  it('renders an empty state without points', () => {
    fixture.componentRef.setInput('points', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todavía no hay volumen semanal');
  });

  it('maps points to separate volume and session series', () => {
    fixture.componentRef.setInput('points', [
      { weekStart: '2026-07-13', volumeKg: 500, sessions: 2 },
      { weekStart: '2026-07-20', volumeKg: 0, sessions: 0 },
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.volumeSeries()).toEqual([
      { label: 'Volumen (kg)', points: [{ x: new Date('2026-07-13'), y: 500 }, { x: new Date('2026-07-20'), y: 0 }] },
    ]);
    expect(fixture.componentInstance.sessionSeries()).toEqual([
      { label: 'Sesiones', points: [{ x: new Date('2026-07-13'), y: 2 }, { x: new Date('2026-07-20'), y: 0 }] },
    ]);
    expect(fixture.nativeElement.querySelectorAll('fg-line-chart')).toHaveLength(2);
  });
});
