import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import type { Activity } from '../../domain/activity.entity';
import { ActivityNotFoundError } from '../../domain/errors/activity-not-found.error';
import { DeleteActivityUseCase } from '../../domain/use-cases/delete-activity.use-case';
import { GetActivityUseCase } from '../../domain/use-cases/get-activity.use-case';
import { ActivityDetailPage } from './activity-detail.page';

const activity: Activity = {
  id: 'run', name: 'Circuito del parque', type: 'run',
  startedAt: new Date(2026, 8, 15).getTime(), importedAt: new Date(2026, 8, 16).getTime(),
  points: [],
  stats: { distanceMeters: 5420, elapsedSeconds: 3900, movingSeconds: 2530, avgSpeedKmh: 7.2, elevationGainMeters: 120.4 },
};

async function flush(fixture: ComponentFixture<ActivityDetailPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  const result = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!result) throw new Error(`No button "${text}"`);
  return result;
}

function stats(root: HTMLElement): Record<string, string | undefined> {
  return Object.fromEntries(Array.from(root.querySelectorAll('dt'), (term) => [
    term.textContent?.trim(), term.nextElementSibling?.textContent?.trim(),
  ]));
}

describe('ActivityDetailPage', () => {
  let fixture: ComponentFixture<ActivityDetailPage>;
  let root: HTMLElement;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let getActivity: jest.Mock<Promise<Activity>, [string]>;
  let deleteActivity: jest.Mock<Promise<void>, [string]>;
  let navigate: jest.SpyInstance;

  beforeEach(() => {
    params = new BehaviorSubject(convertToParamMap({ id: activity.id }));
    getActivity = jest.fn<Promise<Activity>, [string]>().mockResolvedValue(activity);
    deleteActivity = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [ActivityDetailPage],
      providers: [provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: params, snapshot: { paramMap: params.value } } },
        { provide: GetActivityUseCase, useValue: { execute: getActivity } },
        { provide: DeleteActivityUseCase, useValue: { execute: deleteActivity } },
      ],
    });
    navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(ActivityDetailPage);
    root = fixture.nativeElement as HTMLElement;
    await flush(fixture);
  }

  it('shows the name, type, start date, each stat and a back link', async () => {
    await render();

    expect(getActivity).toHaveBeenCalledWith('run');
    expect(root.querySelector('h1')?.textContent).toBe('Circuito del parque');
    expect(root.textContent).toContain('Correr');
    expect(root.textContent).toContain('15 de septiembre de 2026');
    expect(stats(root)).toEqual({
      Distancia: '5,42 km', 'Tiempo total': '1 h 05 min', 'Tiempo en movimiento': '42 min',
      'Velocidad media': '7,2 km/h', 'Desnivel positivo': '+120 m',
    });
    expect(root.querySelector('a[href="/activities"]')?.textContent?.trim()).toBe('Volver a Actividades');
  });

  it('uses the import date and displays a dash for every missing stat without hiding zero distance', async () => {
    getActivity.mockResolvedValueOnce({
      ...activity, startedAt: null,
      stats: { distanceMeters: 0, elapsedSeconds: null, movingSeconds: null, avgSpeedKmh: null, elevationGainMeters: null },
    });
    await render();

    expect(root.textContent).toContain('16 de septiembre de 2026');
    expect(stats(root)).toEqual({
      Distancia: '0 m', 'Tiempo total': '—', 'Tiempo en movimiento': '—',
      'Velocidad media': '—', 'Desnivel positivo': '—',
    });
  });

  it('only deletes after confirmation and returns to the list after the delete resolves', async () => {
    const prompt = '¿Borrar este recorrido? No se puede deshacer.';
    let finish!: () => void;
    deleteActivity.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    await render();

    expect(root.textContent).not.toContain(prompt);
    button(root, 'Borrar recorrido').click();
    fixture.detectChanges();
    expect(root.textContent).toContain(prompt);
    expect(deleteActivity).not.toHaveBeenCalled();

    button(root, 'Cancelar').click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain(prompt);
    expect(deleteActivity).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    button(root, 'Borrar recorrido').click();
    fixture.detectChanges();
    button(root, 'Borrar').click();
    fixture.detectChanges();
    expect(deleteActivity).toHaveBeenCalledTimes(1);
    expect(deleteActivity).toHaveBeenCalledWith(activity.id);
    expect(button(root, 'Borrar').disabled).toBe(true);
    expect(navigate).not.toHaveBeenCalled();

    finish();
    await flush(fixture);
    expect(navigate).toHaveBeenCalledWith(['/activities']);
  });

  it('shows a not-found state with a link back and no stats or delete action', async () => {
    getActivity.mockImplementationOnce(async (id) => { throw new ActivityNotFoundError(id); });
    await render();

    const empty = root.querySelector('fg-empty-state');
    expect(empty?.textContent).toContain('No encontramos este recorrido');
    expect(empty?.querySelector('a')?.getAttribute('href')).toBe('/activities');
    expect(stats(root)).toEqual({});
    expect(root.textContent).not.toContain('Borrar recorrido');
    expect(deleteActivity).not.toHaveBeenCalled();
  });
});
