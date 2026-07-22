import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseProgressListComponent } from './exercise-progress-list.component';

describe('ExerciseProgressListComponent', () => {
  let fixture: ComponentFixture<ExerciseProgressListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ExerciseProgressListComponent] }).compileComponents();
    fixture = TestBed.createComponent(ExerciseProgressListComponent);
  });

  it('renders an empty state with no comparable exercise history', () => {
    fixture.componentRef.setInput('entries', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todavía no hay progreso comparable');
  });

  it('renders values, delta and status classes for each entry', () => {
    fixture.componentRef.setInput('entries', [
      {
        exerciseId: 'bench', exerciseName: 'Bench Press', trackingType: 'weight-reps',
        firstValue: 100, latestValue: 110, deltaPct: 10, status: 'improving', unitLabel: 'kg',
      },
      {
        exerciseId: 'plank', exerciseName: 'Plank', trackingType: 'time',
        firstValue: 60, latestValue: 60, deltaPct: 0, status: 'stable', unitLabel: 'sec',
      },
      {
        exerciseId: 'run', exerciseName: 'Run', trackingType: 'distance-time',
        firstValue: 300, latestValue: 330, deltaPct: -10, status: 'no-progress', unitLabel: 'sec/km',
      },
    ]);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Bench Press');
    expect(element.textContent).toContain('110 kg');
    expect(element.textContent).toContain('+10%');
    expect(element.querySelector('.status-improving')).toBeTruthy();
    expect(element.querySelector('.status-stable')).toBeTruthy();
    expect(element.querySelector('.status-no-progress')).toBeTruthy();
  });
});
