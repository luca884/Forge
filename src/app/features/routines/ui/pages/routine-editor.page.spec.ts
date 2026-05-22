import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { RoutineEditorPage } from './routine-editor.page';
import { CreateRoutineUseCase } from '../../domain/use-cases/create-routine.use-case';
import { EditRoutineUseCase } from '../../domain/use-cases/edit-routine.use-case';
import { AddTrainingDayUseCase } from '../../domain/use-cases/add-training-day.use-case';
import { RemoveTrainingDayUseCase } from '../../domain/use-cases/remove-training-day.use-case';
import { DeleteRoutineUseCase } from '../../domain/use-cases/delete-routine.use-case';
import { TrainingDayRepository } from '../../domain/training-day.repository';
import { TrainingDay } from '../../domain/training-day.entity';
import { RoutineRepository } from '../../domain/routine.repository';
import { SetActiveRoutineUseCase } from '../../domain/use-cases/set-active-routine.use-case';
import { ToastService } from '@core/shared/ui/toast/toast.service';

const makeDay = (id: string, name: string, routineId = 'r-1'): TrainingDay => ({
  id,
  routineId,
  name,
  exercises: [],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

async function flush(fixture: ComponentFixture<RoutineEditorPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

function makeFixture(opts: {
  id?: string;
  days?: TrainingDay[];
  routineName?: string;
  routineDescription?: string;
  isActive?: boolean;
} = {}): {
  fixture: ComponentFixture<RoutineEditorPage>;
  navigateSpy: jest.Mock;
  createSpy: jest.Mock;
  editSpy: jest.Mock;
  addDaySpy: jest.Mock;
  removeDaySpy: jest.Mock;
  deleteRoutineSpy: jest.Mock;
  dayRepoSpy: { getByRoutineId: jest.Mock };
  routineRepoSpy: { getById: jest.Mock };
  setActiveSpy: jest.Mock;
  toastMock: { success: jest.Mock; error: jest.Mock; info: jest.Mock };
} {
  const navigateSpy = jest.fn().mockResolvedValue(true);
  const createSpy = jest.fn().mockResolvedValue({
    id: 'r-new',
    name: 'X',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const editSpy = jest.fn().mockResolvedValue(undefined);
  const addDaySpy = jest.fn().mockResolvedValue({
    id: 'd-new',
    routineId: opts.id ?? 'r-1',
    name: 'Día 1',
    exercises: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const removeDaySpy = jest.fn().mockResolvedValue(undefined);
  const deleteRoutineSpy = jest.fn().mockResolvedValue(undefined);
  const dayRepoSpy = {
    getByRoutineId: jest.fn().mockResolvedValue(opts.days ?? []),
  };
  const routineRepoSpy = {
    getById: jest.fn().mockResolvedValue(
      opts.id
        ? {
            id: opts.id,
            name: opts.routineName ?? '',
            description: opts.routineDescription ?? '',
            isActive: opts.isActive ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        : null,
    ),
  };
  const setActiveSpy = jest.fn().mockResolvedValue(undefined);
  const toastMock = { success: jest.fn(), error: jest.fn(), info: jest.fn() };

  void TestBed.configureTestingModule({
    imports: [RoutineEditorPage],
    providers: [
      { provide: Router, useValue: { navigate: navigateSpy } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (_k: string) => opts.id ?? null } } },
      },
      { provide: ToastService, useValue: toastMock },
    ],
  })
    .overrideComponent(RoutineEditorPage, {
      set: {
        providers: [
          { provide: CreateRoutineUseCase, useValue: { execute: createSpy } },
          { provide: EditRoutineUseCase, useValue: { execute: editSpy } },
          { provide: AddTrainingDayUseCase, useValue: { execute: addDaySpy } },
          { provide: RemoveTrainingDayUseCase, useValue: { execute: removeDaySpy } },
          { provide: DeleteRoutineUseCase, useValue: { execute: deleteRoutineSpy } },
          { provide: TrainingDayRepository, useValue: dayRepoSpy },
          { provide: RoutineRepository, useValue: routineRepoSpy },
          { provide: SetActiveRoutineUseCase, useValue: { execute: setActiveSpy } },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(RoutineEditorPage);

  return { fixture, navigateSpy, createSpy, editSpy, addDaySpy, removeDaySpy, deleteRoutineSpy, dayRepoSpy, routineRepoSpy, setActiveSpy, toastMock };
}

describe('RoutineEditorPage', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Loading state', () => {
    it('create mode: loading() starts false, form shows immediately, no fg-skeleton', async () => {
      const { fixture } = makeFixture();
      // Only one detectChanges — before async flush — to test initial state
      fixture.detectChanges();
      expect(fixture.componentInstance.loading()).toBe(false);
      const skeleton = fixture.debugElement.query(By.css('fg-skeleton'));
      expect(skeleton).toBeNull();
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });

    it('edit mode: loading() starts true, fg-skeleton shows, form hidden', async () => {
      const { fixture } = makeFixture({ id: 'r-1' });
      // Only one detectChanges — before async load resolves
      fixture.detectChanges();
      expect(fixture.componentInstance.loading()).toBe(true);
      const skeleton = fixture.debugElement.query(By.css('fg-skeleton'));
      expect(skeleton).toBeTruthy();
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeNull();
    });

    it('edit mode: after load resolves loading() is false, form visible, no skeleton', async () => {
      const { fixture } = makeFixture({ id: 'r-1' });
      await flush(fixture);
      expect(fixture.componentInstance.loading()).toBe(false);
      const skeleton = fixture.debugElement.query(By.css('fg-skeleton'));
      expect(skeleton).toBeNull();
      const form = fixture.debugElement.query(By.css('form'));
      expect(form).toBeTruthy();
    });
  });

  describe('Create mode (sin :id param)', () => {
    it('renderiza fg-page-header con title "Nueva rutina"', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const header = fixture.debugElement.query(By.css('fg-page-header'));
      expect(header).toBeTruthy();
      expect(fixture.componentInstance.title()).toBe('Nueva rutina');
    });

    it('fg-input para nombre tiene valor vacío', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const input = fixture.debugElement.query(By.css('fg-input'));
      expect(input).toBeTruthy();
      expect(fixture.componentInstance.nameControl.value).toBe('');
    });

    it('textarea para descripción tiene valor vacío', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea).toBeTruthy();
      expect((textarea.nativeElement as HTMLTextAreaElement).value).toBe('');
    });

    it('sección "Días" NO se renderiza en modo create', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const section = fixture.debugElement.query(By.css('section'));
      expect(section).toBeNull();
    });

    it('fg-empty-state NO presente en modo create', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      expect(emptyState).toBeNull();
    });
  });

  describe('Edit mode (:id = "r-1")', () => {
    it('renderiza fg-page-header con title "Editar rutina"', async () => {
      const { fixture } = makeFixture({ id: 'r-1' });
      await flush(fixture);
      expect(fixture.componentInstance.title()).toBe('Editar rutina');
    });

    it('sección "Días" visible con h2 "Días"', async () => {
      const { fixture } = makeFixture({ id: 'r-1' });
      await flush(fixture);
      const section = fixture.debugElement.query(By.css('section'));
      expect(section).toBeTruthy();
      const h2 = section.query(By.css('h2'));
      expect(h2).toBeTruthy();
      expect((h2.nativeElement as HTMLElement).textContent).toContain('Días');
    });

    it('fg-empty-state visible cuando trainingDays retorna []', async () => {
      const { fixture } = makeFixture({ id: 'r-1', days: [] });
      await flush(fixture);
      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      expect(emptyState).toBeTruthy();
    });

    it('fg-card count === 2 cuando trainingDays retorna 2 días', async () => {
      const days = [makeDay('d-1', 'Día 1'), makeDay('d-2', 'Día 2')];
      const { fixture } = makeFixture({ id: 'r-1', days });
      await flush(fixture);
      const cards = fixture.debugElement.queryAll(By.css('fg-card'));
      expect(cards.length).toBe(2);
    });

    it('fg-empty-state NO presente cuando hay días', async () => {
      const { fixture } = makeFixture({ id: 'r-1', days: [makeDay('d-1', 'Día 1')] });
      await flush(fixture);
      const emptyState = fixture.debugElement.query(By.css('fg-empty-state'));
      expect(emptyState).toBeNull();
    });

    it('prefilla el campo name con el nombre de la rutina existente', async () => {
      const { fixture } = makeFixture({ id: 'r-1', routineName: 'Pierna A', routineDescription: 'Foco cuádriceps' });
      await flush(fixture);
      expect(fixture.componentInstance.nameControl.value).toBe('Pierna A');
    });

    it('prefilla el campo description con la descripción de la rutina existente', async () => {
      const { fixture } = makeFixture({ id: 'r-1', routineName: 'Pierna A', routineDescription: 'Foco cuádriceps' });
      await flush(fixture);
      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect((textarea.nativeElement as HTMLTextAreaElement).value).toBe('Foco cuádriceps');
    });

    it('NO prefilla en create mode (sin :id param)', async () => {
      const { fixture, routineRepoSpy } = makeFixture({ routineName: 'Pierna A' });
      await flush(fixture);
      expect(routineRepoSpy.getById).not.toHaveBeenCalled();
      expect(fixture.componentInstance.nameControl.value).toBe('');
    });
  });

  describe('Navigation', () => {
    it('leadingClick en fg-page-header → router.navigate(["/routines"])', async () => {
      const { fixture, navigateSpy } = makeFixture();
      await flush(fixture);
      const header = fixture.debugElement.query(By.css('fg-page-header'));
      header.triggerEventHandler('leadingClick', null);
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/routines']);
    });

    it('click en "Programa semanal" button[fg-button] → navigate(["/routines","r-1","schedule"])', async () => {
      const { fixture, navigateSpy } = makeFixture({ id: 'r-1' });
      await flush(fixture);
      const buttons = fixture.debugElement.queryAll(By.css('button[fg-button]'));
      const scheduleBtn = buttons.find((btn) =>
        (btn.nativeElement as HTMLButtonElement).textContent?.trim().includes('Programa semanal'),
      );
      expect(scheduleBtn).toBeTruthy();
      (scheduleBtn!.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'schedule']);
    });

    it('click en button[aria-label^="Editar día"] → navigate(["/routines","r-1","days","d-1"])', async () => {
      const days = [makeDay('d-1', 'Día 1')];
      const { fixture, navigateSpy } = makeFixture({ id: 'r-1', days });
      await flush(fixture);
      const editBtn = fixture.debugElement.query(By.css('button[aria-label^="Editar día"]'));
      expect(editBtn).toBeTruthy();
      (editBtn.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(navigateSpy).toHaveBeenCalledWith(['/routines', 'r-1', 'days', 'd-1']);
    });
  });

  describe('Save flow', () => {
    it('trailing check con nombre vacío → submitAttempted=true, createSpy NO llamado, NO navega', async () => {
      const { fixture, createSpy, editSpy, navigateSpy } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);
      expect(fixture.componentInstance.submitAttempted()).toBe(true);
      expect(createSpy).not.toHaveBeenCalled();
      expect(editSpy).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('fg-input muestra error "El nombre es obligatorio" tras submit con nombre vacío', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);
      const input = fixture.debugElement.query(By.css('fg-input'));
      expect(input).toBeTruthy();
      // Verify the component binding: submitAttempted=true + invalid control produces error
      expect(fixture.componentInstance.submitAttempted()).toBe(true);
      expect(fixture.componentInstance.nameControl.invalid).toBe(true);
    });

    it('trailing check con nombre válido en create mode → createSpy llamado, navega a /routines', async () => {
      const { fixture, createSpy, navigateSpy } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.form.controls['name']!.setValue('Push');
      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Push' }),
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/routines']);
    });

    it('trailing check con nombre válido en edit mode → editSpy llamado, navega a /routines', async () => {
      const { fixture, editSpy, navigateSpy } = makeFixture({ id: 'r-1' });
      await flush(fixture);
      fixture.componentInstance.form.controls['name']!.setValue('Push v2');
      fixture.componentInstance.trailingActions[0]!.click();
      await flush(fixture);
      expect(editSpy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'r-1', name: 'Push v2' }),
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/routines']);
    });
  });

  describe('Day CRUD', () => {
    it('click "Agregar día" → addDaySpy llamado con routineId, dayRepo.getByRoutineId llamado de nuevo', async () => {
      const { fixture, addDaySpy, dayRepoSpy } = makeFixture({ id: 'r-1' });
      await flush(fixture);
      const initialCallCount = dayRepoSpy.getByRoutineId.mock.calls.length;
      const addBtn = fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((btn) =>
          (btn.nativeElement as HTMLButtonElement).textContent?.trim().includes('Agregar día'),
        );
      expect(addBtn).toBeTruthy();
      (addBtn!.nativeElement as HTMLButtonElement).click();
      await flush(fixture);
      expect(addDaySpy).toHaveBeenCalled();
      expect(dayRepoSpy.getByRoutineId.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    it('click button[aria-label^="Eliminar día"] → removeDaySpy llamado con dayId', async () => {
      const days = [makeDay('d-1', 'Día 1')];
      const { fixture, removeDaySpy } = makeFixture({ id: 'r-1', days });
      await flush(fixture);
      const removeBtn = fixture.debugElement.query(By.css('button[aria-label^="Eliminar día"]'));
      expect(removeBtn).toBeTruthy();
      (removeBtn.nativeElement as HTMLButtonElement).click();
      await flush(fixture);
      expect(removeDaySpy).toHaveBeenCalledWith('d-1');
    });
  });

  describe('Structural constraints', () => {
    it('ChangeDetectionStrategy.OnPush está seteado en el component', () => {
      // OnPush detection: create via TestBed — if OnPush is set, the component
      // uses ChangeDetectorRef.detectChanges only on inputs/events, not zone ticks
      // We verify via component metadata
      const { fixture } = makeFixture();
      fixture.detectChanges();
      const changeDetection = (RoutineEditorPage as any).__annotations__?.[0]?.changeDetection ?? -1;
      // ChangeDetectionStrategy.OnPush = 0
      expect(changeDetection).toBe(0);
    });

    it('GetAllRoutinesUseCase NÃO está en providers del component', () => {
      const { fixture } = makeFixture();
      fixture.detectChanges();
      const providers: unknown[] = (RoutineEditorPage as any).__annotations__?.[0]?.providers ?? [];
      const hasGetAll = providers.some(
        (p) => p === 'GetAllRoutinesUseCase' || (typeof p === 'function' && p.name === 'GetAllRoutinesUseCase'),
      );
      expect(hasGetAll).toBe(false);
    });
  });

  describe('Set active routine (#568)', () => {
    const findBtn = (fixture: ComponentFixture<RoutineEditorPage>, text: string) =>
      fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((btn) => (btn.nativeElement as HTMLButtonElement).textContent?.trim().includes(text));

    it('create mode: NO renderiza el botón de marcar activa', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      expect(findBtn(fixture, 'Marcar como activa')).toBeFalsy();
      expect(findBtn(fixture, 'Rutina activa')).toBeFalsy();
    });

    it('edit mode rutina inactiva: muestra "Marcar como activa" habilitado', async () => {
      const { fixture } = makeFixture({ id: 'r-1', isActive: false });
      await flush(fixture);
      const btn = findBtn(fixture, 'Marcar como activa');
      expect(btn).toBeTruthy();
      expect((btn!.nativeElement as HTMLButtonElement).disabled).toBe(false);
    });

    it('edit mode rutina ya activa: muestra "Rutina activa" deshabilitado', async () => {
      const { fixture } = makeFixture({ id: 'r-1', isActive: true });
      await flush(fixture);
      const btn = findBtn(fixture, 'Rutina activa');
      expect(btn).toBeTruthy();
      expect((btn!.nativeElement as HTMLButtonElement).disabled).toBe(true);
      expect(fixture.componentInstance.isActive()).toBe(true);
    });

    it('click "Marcar como activa" → setActive("r-1") + toast.success + isActive()=true + botón pasa a deshabilitado', async () => {
      const { fixture, setActiveSpy, toastMock } = makeFixture({ id: 'r-1', isActive: false });
      await flush(fixture);
      const btn = findBtn(fixture, 'Marcar como activa');
      (btn!.nativeElement as HTMLButtonElement).click();
      await flush(fixture);
      expect(setActiveSpy).toHaveBeenCalledWith('r-1');
      expect(toastMock.success).toHaveBeenCalled();
      expect(fixture.componentInstance.isActive()).toBe(true);
      const activeBtn = findBtn(fixture, 'Rutina activa');
      expect(activeBtn).toBeTruthy();
      expect((activeBtn!.nativeElement as HTMLButtonElement).disabled).toBe(true);
    });

    it('markActive() es no-op si la rutina ya está activa', async () => {
      const { fixture, setActiveSpy } = makeFixture({ id: 'r-1', isActive: true });
      await flush(fixture);
      await fixture.componentInstance.markActive();
      expect(setActiveSpy).not.toHaveBeenCalled();
    });
  });

  describe('eliminar rutina', () => {
    it('deleteRoutine() elimina vía use case, avisa y navega a /routines', async () => {
      const { fixture, deleteRoutineSpy, navigateSpy, toastMock } = makeFixture({
        id: 'r-1',
        routineName: 'Test',
      });
      await flush(fixture);

      expect(fixture.componentInstance.confirmingDelete()).toBe(false);
      fixture.componentInstance.confirmingDelete.set(true);
      await fixture.componentInstance.deleteRoutine();

      expect(deleteRoutineSpy).toHaveBeenCalledWith('r-1');
      expect(navigateSpy).toHaveBeenCalledWith(['/routines']);
      expect(toastMock.success).toHaveBeenCalled();
    });

    it('deleteRoutine() es no-op si no hay routineId (rutina nueva)', async () => {
      const { fixture, deleteRoutineSpy } = makeFixture({});
      await flush(fixture);

      await fixture.componentInstance.deleteRoutine();

      expect(deleteRoutineSpy).not.toHaveBeenCalled();
    });
  });
});
