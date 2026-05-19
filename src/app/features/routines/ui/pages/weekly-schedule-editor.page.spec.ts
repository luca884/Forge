import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { WeeklyScheduleEditorPage } from './weekly-schedule-editor.page';
import { RoutineRepository } from '../../domain/routine.repository';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { SetWeeklyScheduleUseCase } from '../../domain/use-cases/set-weekly-schedule.use-case';
import { TrainingDay } from '../../domain/training-day.entity';
import { Routine } from '../../domain/routine.entity';

const makeDay = (id: string, name: string, routineId = 'r-1'): TrainingDay => ({
  id,
  routineId,
  name,
  exercises: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const makeRoutine = (id: string, schedule?: Routine['schedule']): Routine => ({
  id,
  name: 'Push',
  isActive: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  schedule,
});

async function flush(fixture: ComponentFixture<WeeklyScheduleEditorPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

function makeFixture(opts: {
  routineId?: string;
  routine?: Routine;
  days?: TrainingDay[];
} = {}): {
  fixture: ComponentFixture<WeeklyScheduleEditorPage>;
  navigateSpy: jest.Mock;
  setScheduleSpy: jest.Mock;
  routineRepoSpy: { getById: jest.Mock };
  dayRepoSpy: { getByRoutineId: jest.Mock };
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const setScheduleSpy = jest.fn().mockResolvedValue(undefined);
  const routineRepoSpy = {
    getById: jest.fn().mockResolvedValue(
      opts.routine ?? makeRoutine(opts.routineId ?? 'r-1'),
    ),
  };
  const dayRepoSpy = {
    getByRoutineId: jest.fn().mockResolvedValue(
      opts.days ?? [makeDay('d-1', 'Día 1')],
    ),
  };

  void TestBed.configureTestingModule({
    imports: [WeeklyScheduleEditorPage],
    providers: [
      { provide: Router, useValue: { navigate: navigateSpy } },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: { paramMap: { get: (_k: string) => opts.routineId ?? 'r-1' } },
        },
      },
    ],
  })
    .overrideComponent(WeeklyScheduleEditorPage, {
      set: {
        providers: [
          { provide: RoutineRepository, useValue: routineRepoSpy },
          { provide: TrainingDayRepository, useValue: dayRepoSpy },
          { provide: SetWeeklyScheduleUseCase, useValue: { execute: setScheduleSpy } },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(WeeklyScheduleEditorPage);

  return { fixture, navigateSpy, setScheduleSpy, routineRepoSpy, dayRepoSpy };
}

describe('WeeklyScheduleEditorPage', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Rendering', () => {
    it('fg-page-header presente con title "Programa semanal"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const header = fixture.debugElement.query(By.css('fg-page-header'));
      expect(header).toBeTruthy();
      expect(header.attributes['title']).toBe('Programa semanal');
    });

    it('renderiza exactamente 7 <select> tras loadData', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const selects = fixture.debugElement.queryAll(By.css('select'));
      expect(selects.length).toBe(7);
    });

    it('cada select tiene placeholder <option value="">', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const selects = fixture.debugElement.queryAll(By.css('select'));
      expect(selects.length).toBe(7);
      for (const sel of selects) {
        const placeholder = (sel.nativeElement as HTMLSelectElement).querySelector('option[value=""]');
        expect(placeholder).toBeTruthy();
      }
    });

    it('cada select tiene N opciones adicionales cuando N días retornados', async () => {
      const days = [makeDay('d-1', 'Día 1'), makeDay('d-2', 'Día 2')];
      const { fixture } = makeFixture({ days });
      await flush(fixture);
      const selects = fixture.debugElement.queryAll(By.css('select'));
      expect(selects.length).toBe(7);
      // Each select has placeholder + N day options
      for (const sel of selects) {
        const options = (sel.nativeElement as HTMLSelectElement).querySelectorAll('option');
        expect(options.length).toBe(3); // 1 placeholder + 2 days
      }
    });

    it('loading()=true → fg-skeleton visible, selects count = 0', async () => {
      const { fixture } = makeFixture();
      // Only detectChanges once — loading is true initially
      fixture.detectChanges();
      const skeleton = fixture.debugElement.query(By.css('fg-skeleton'));
      expect(skeleton).toBeTruthy();
      const selects = fixture.debugElement.queryAll(By.css('select'));
      expect(selects.length).toBe(0);
    });
  });

  describe('Pre-population', () => {
    it('routine.schedule.monday = "d-1" → select para Lunes tiene valor "d-1" tras init', async () => {
      const routine = makeRoutine('r-1', { monday: 'd-1' });
      const { fixture } = makeFixture({ routine });
      await flush(fixture);
      const selects = fixture.debugElement.queryAll(By.css('select'));
      // monday is first in DAYS_OF_WEEK
      const mondaySelect = selects[0]?.nativeElement as HTMLSelectElement;
      expect(mondaySelect.value).toBe('d-1');
    });
  });

  describe('Save flow', () => {
    it('trailing check con selects vacíos → setScheduleSpy llamado con routineId y schedule vacío', async () => {
      const days: TrainingDay[] = [];
      const { fixture, setScheduleSpy } = makeFixture({ days });
      await flush(fixture);
      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);
      expect(setScheduleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ routineId: 'r-1', schedule: {} }),
      );
    });

    it('trailing check con monday="d-1" → setScheduleSpy llamado con schedule incluyendo monday', async () => {
      const days = [makeDay('d-1', 'Día 1')];
      const { fixture, setScheduleSpy } = makeFixture({ days });
      await flush(fixture);
      // Set monday control value
      fixture.componentInstance.form.controls['monday']!.setValue('d-1');
      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);
      expect(setScheduleSpy).toHaveBeenCalledWith(
        expect.objectContaining({ routineId: 'r-1', schedule: expect.objectContaining({ monday: 'd-1' }) }),
      );
    });

    it('save success → successMessage visible inmediatamente, navigate llamado tras 1000ms timeout', async () => {
      // Strategy: spy on setTimeout to capture the callback, then call it manually.
      // This avoids fakeAsync/tick incompatibility with Jest mock Promises.
      let capturedCallback: (() => void) | null = null;
      const setTimeoutSpy: jest.SpyInstance = jest.spyOn(global, 'setTimeout');
      setTimeoutSpy.mockImplementation((fn: TimerHandler) => {
        capturedCallback = fn as () => void;
        return 0 as unknown as ReturnType<typeof setTimeout>;
      });

      try {
        const { fixture, navigateSpy } = makeFixture();
        await flush(fixture);

        // Trigger save
        fixture.componentInstance.trailingActions[0]!.click();
        await flush(fixture);

        // successMessage should be set (save completed, setTimeout captured but not yet called)
        expect(fixture.componentInstance.successMessage()).toBeTruthy();
        const successP = fixture.debugElement.query(By.css('p[role="status"]'));
        expect(successP).toBeTruthy();

        // navigate NOT yet called
        expect(navigateSpy).not.toHaveBeenCalled();

        // Call the captured callback (simulates 1000ms passing)
        expect(capturedCallback).not.toBeNull();
        capturedCallback!();
        fixture.detectChanges();
        expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
      } finally {
        setTimeoutSpy.mockRestore();
      }
    });

    it('save rejects → errorMessage visible, router.navigate NOT called', async () => {
      const { fixture, setScheduleSpy, navigateSpy } = makeFixture();
      setScheduleSpy.mockRejectedValue(new Error('fallo'));
      await flush(fixture);

      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);

      expect(fixture.componentInstance.errorMessage()).toBeTruthy();
      const alertP = fixture.debugElement.query(By.css('p[role="alert"]'));
      expect(alertP).toBeTruthy();
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('leadingClick en fg-page-header → router.navigate(["/routines","r-1"])', async () => {
      const { fixture, navigateSpy } = makeFixture();
      await flush(fixture);
      const header = fixture.debugElement.query(By.css('fg-page-header'));
      header.triggerEventHandler('leadingClick', null);
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1']);
    });
  });

  describe('Structural constraints', () => {
    it('ChangeDetectionStrategy.OnPush está seteado en el component', () => {
      const { fixture } = makeFixture();
      fixture.detectChanges();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const changeDetection = (WeeklyScheduleEditorPage as any).__annotations__?.[0]?.changeDetection ?? -1;
      // ChangeDetectionStrategy.OnPush = 0
      expect(changeDetection).toBe(0);
    });

    it('NO hay <button> con texto "Guardar" en el footer', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const allButtons = fixture.debugElement.queryAll(By.css('button'));
      const guardarBtn = allButtons.find(
        (btn) => (btn.nativeElement as HTMLButtonElement).textContent?.trim() === 'Guardar',
      );
      expect(guardarBtn).toBeUndefined();
    });

    it('NO hay <button> con texto "Cancelar" en el footer', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const allButtons = fixture.debugElement.queryAll(By.css('button'));
      const cancelarBtn = allButtons.find(
        (btn) => (btn.nativeElement as HTMLButtonElement).textContent?.trim() === 'Cancelar',
      );
      expect(cancelarBtn).toBeUndefined();
    });
  });
});
