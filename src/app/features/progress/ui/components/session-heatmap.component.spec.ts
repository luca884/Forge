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

  it('renders 84 cells by default (empty heatmap)', () => {
    const cells = component.cells;
    expect(cells).toHaveLength(84);
  });

  it('all cells are gray when heatmapData is empty', () => {
    const cells = component.cells;
    cells.forEach(cell => {
      expect(component.colorClass(cell.count)).toBe('bg-gray-200');
    });
  });

  it('returns bg-green-200 for count 1', () => {
    expect(component.colorClass(1)).toBe('bg-green-200');
  });

  it('returns bg-green-400 for count 2', () => {
    expect(component.colorClass(2)).toBe('bg-green-400');
  });

  it('returns bg-green-600 for count 3 or more', () => {
    expect(component.colorClass(3)).toBe('bg-green-600');
    expect(component.colorClass(10)).toBe('bg-green-600');
  });

  it('tooltip shows date and session count', () => {
    const cell = { date: '2026-05-15', count: 2, label: '15 de mayo de 2026' };
    expect(component.tooltip(cell)).toBe('15 de mayo de 2026 • 2 sesiones');
  });

  it('tooltip uses singular "sesión" for count 1', () => {
    const cell = { date: '2026-05-15', count: 1, label: '15 de mayo de 2026' };
    expect(component.tooltip(cell)).toBe('15 de mayo de 2026 • 1 sesión');
  });

  it('cells reflect heatmapData counts', () => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');
    const data = new Map([[todayKey, 3]]);
    fixture.componentRef.setInput('heatmapData', data);
    fixture.detectChanges();

    const todayCell = component.cells.find(c => c.date === todayKey);
    expect(todayCell).toBeDefined();
    expect(todayCell!.count).toBe(3);
    expect(component.colorClass(3)).toBe('bg-green-600');
  });
});
