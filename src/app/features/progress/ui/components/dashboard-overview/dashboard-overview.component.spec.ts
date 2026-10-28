import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardOverviewComponent } from './dashboard-overview.component';
import type { DashboardOverview } from '../../../domain/models/dashboard-overview.model';

const overview: DashboardOverview = {
  sessionsCurrent: 12, sessionsPrior: 10, sessionsDeltaPct: 20,
  setsCurrent: 80, setsPrior: 70, setsDeltaPct: -8,
  volumeCurrentKg: 4_500, volumePriorKg: 0, volumeDeltaPct: null,
};

describe('DashboardOverviewComponent', () => {
  let fixture: ComponentFixture<DashboardOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DashboardOverviewComponent] }).compileComponents();
    fixture = TestBed.createComponent(DashboardOverviewComponent);
  });

  it('renders skeletons while overview is unavailable', () => {
    fixture.componentRef.setInput('overview', null);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('fg-skeleton')).toHaveLength(3);
  });

  it('renders current values and sign-aware delta chips', () => {
    fixture.componentRef.setInput('overview', overview);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('12');
    expect(element.textContent).toContain('+20%');
    expect(element.textContent).toContain('-8%');
    expect(element.textContent).toContain('—');
    expect(element.querySelector('.delta-positive')).toBeTruthy();
    expect(element.querySelector('.delta-negative')).toBeTruthy();
    expect(element.querySelector('.delta-neutral')).toBeTruthy();
  });

  it('labels the three figures Sesiones, Series and Volumen under a "Últimos 30 días" heading', () => {
    fixture.componentRef.setInput('overview', overview);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h2')?.textContent?.trim()).toBe('Últimos 30 días');
    const text = element.textContent ?? '';
    expect(text).toContain('Sesiones');
    expect(text).toContain('Series');
    expect(text).not.toContain('Sets');
    expect(text).not.toContain('Volumen kg');
  });

  it('shows the volume in kg by default, through DisplayWeightPipe', () => {
    fixture.componentRef.setInput('overview', overview);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('4500 kg');
  });

  it('shows the volume in lb when the preferred unit is lb', () => {
    fixture.componentRef.setInput('overview', overview);
    fixture.componentRef.setInput('unit', 'lb');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('9920.8 lb');
    expect(text).not.toContain('kg');
  });
});
