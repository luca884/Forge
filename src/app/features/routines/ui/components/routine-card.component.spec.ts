import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoutineCardComponent } from './routine-card.component';
import { Routine } from '../../domain/routine.entity';

const baseRoutine: Routine = {
  id: 'r-1',
  name: 'Push',
  isActive: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('RoutineCardComponent', () => {
  let fixture: ComponentFixture<RoutineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RoutineCardComponent);
  });

  it('renderiza el name', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Push');
  });

  it('muestra "1 día" cuando dayCount = 1 (singular)', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.componentRef.setInput('dayCount', 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('1 día');
    expect(fixture.nativeElement.textContent).not.toContain('1 días');
  });

  it('muestra "N días" cuando dayCount > 1 (plural)', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.componentRef.setInput('dayCount', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3 días');
  });

  it('muestra chip "Activa" cuando routine.isActive = true', () => {
    fixture.componentRef.setInput('routine', { ...baseRoutine, isActive: true });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Activa');
  });

  it('NO muestra chip "Activa" cuando routine.isActive = false', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Activa');
  });

  it('emite cardClick con la routine al hacer click', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.detectChanges();
    let emitted: Routine | undefined;
    fixture.componentInstance.cardClick.subscribe((r) => (emitted = r));
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toEqual(baseRoutine);
  });
});
