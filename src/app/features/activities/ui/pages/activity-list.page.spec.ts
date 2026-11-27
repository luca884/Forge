import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import type { Activity } from '../../domain/activity.entity';
import { ActivityRepository, type ActivitySummary } from '../../domain/activity.repository';
import { ImportActivityUseCase } from '../../domain/use-cases/import-activity.use-case';
import { ListActivitiesUseCase } from '../../domain/use-cases/list-activities.use-case';
import { ActivityListPage } from './activity-list.page';

jest.mock('@core/shared/utils/uuid', () => ({ generateUUID: () => 'e7727f1a-d0a4-41cc-9c32-05d749cb8a79' }));

const recent: ActivitySummary = {
  id: 'bike', name: 'Vuelta al lago', type: 'bike',
  startedAt: new Date(2026, 8, 15).getTime(), importedAt: new Date(2026, 8, 16).getTime(),
  stats: { distanceMeters: 5420, elapsedSeconds: 2530, movingSeconds: 2300, avgSpeedKmh: 7.2, elevationGainMeters: 80 },
};
const older: ActivitySummary = {
  id: 'walk', name: 'Costanera', type: 'walk',
  startedAt: null, importedAt: new Date(2026, 8, 10).getTime(),
  stats: { distanceMeters: 850, elapsedSeconds: null, movingSeconds: null, avgSpeedKmh: null, elevationGainMeters: null },
};

function gpx(type = ''): string {
  return `<gpx><trk>${type}<trkseg><trkpt lat="0" lon="0"/><trkpt lat="0" lon="0.001"/></trkseg></trk></gpx>`;
}

class StubActivityRepository extends ActivityRepository {
  override save = jest.fn<Promise<void>, [Activity]>().mockResolvedValue(undefined);
  override list = jest.fn<Promise<ActivitySummary[]>, []>().mockResolvedValue([]);
  override getById = jest.fn<Promise<Activity | null>, [string]>();
  override delete = jest.fn<Promise<void>, [string]>();
}

async function flush(fixture: ComponentFixture<ActivityListPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  // whenStable alone does not wait for promises started by a lifecycle hook or DOM handler, and
  // fake-indexeddb settles on macrotasks, so wait one full task turn.
  await new Promise<void>((resolve) => setTimeout(resolve));
  fixture.detectChanges();
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  const result = Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.trim() === text);
  if (!result) throw new Error(`No button "${text}"`);
  return result;
}

function selectFile(input: HTMLInputElement, text: () => Promise<string>, fileName = 'costanera.gpx'): void {
  const file = { name: fileName, text } as unknown as File;
  Object.defineProperties(input, {
    files: { configurable: true, value: [file] },
    value: { configurable: true, writable: true, value: fileName },
  });
  input.dispatchEvent(new Event('change'));
}

describe('ActivityListPage', () => {
  let fixture: ComponentFixture<ActivityListPage>;
  let root: HTMLElement;
  let repo: StubActivityRepository;
  let navigate: jest.SpyInstance;
  let executeImport: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ActivityListPage],
      providers: [provideRouter([]), ListActivitiesUseCase, ImportActivityUseCase,
        { provide: ActivityRepository, useClass: StubActivityRepository }],
    });
    repo = TestBed.inject(ActivityRepository) as StubActivityRepository;
    navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    executeImport = jest.spyOn(TestBed.inject(ImportActivityUseCase), 'execute');
    fixture = TestBed.createComponent(ActivityListPage);
    root = fixture.nativeElement as HTMLElement;
  });

  function fileInput(): HTMLInputElement {
    const input = root.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('No GPX file input');
    return input;
  }

  it('shows the empty state and opens the GPX file picker', async () => {
    await flush(fixture);

    expect(root.querySelector('h1')?.textContent).toBe('Actividades');
    const emptyState = root.querySelector<HTMLElement>('fg-empty-state');
    if (!emptyState) throw new Error('No empty state');
    expect(emptyState.textContent).toContain('Todavía no importaste ningún recorrido');
    const input = fileInput();
    const pick = jest.spyOn(input, 'click').mockImplementation(() => undefined);
    expect(input.accept).toBe('.gpx,application/gpx+xml,application/xml,text/xml');
    expect(input.hidden).toBe(true);
    button(emptyState, 'Importar GPX').click();
    expect(pick).toHaveBeenCalledTimes(1);
  });

  it('shows activities in the order returned by the use case with a link, date and stats for each', async () => {
    repo.list.mockResolvedValueOnce([recent, older]);
    await flush(fixture);

    const links = Array.from(root.querySelectorAll('li a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/activities/bike', '/activities/walk']);
    expect(links[0]?.textContent).toMatch(/Vuelta al lago.*Bici.*15 de septiembre de 2026.*5,42 km.*42 min.*7,2 km\/h/s);
    expect(links[1]?.textContent).toMatch(/Costanera.*Caminata.*10 de septiembre de 2026.*850 m.*—.*—/s);
    expect(root.querySelector('fg-empty-state')).toBeNull();
    expect(button(root, 'Importar GPX').disabled).toBe(false);
  });

  it('resets the input, disables the button during import, saves and opens the new detail', async () => {
    await flush(fixture);
    const xml = gpx('<type>cycling</type>');
    let finish!: (text: string) => void;
    const text = jest.fn(() => new Promise<string>((resolve) => { finish = resolve; }));
    const input = fileInput();
    selectFile(input, text);
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(button(root, 'Importar GPX').disabled).toBe(true);
    expect(repo.save).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    finish(xml);
    await flush(fixture);

    expect(executeImport).toHaveBeenCalledTimes(1);
    expect(executeImport).toHaveBeenCalledWith({ xml, fileName: 'costanera.gpx' });
    expect(repo.save).toHaveBeenCalledTimes(1);
    const saved = repo.save.mock.calls[0]?.[0];
    expect(saved).toMatchObject({ name: 'costanera', type: 'bike' });
    expect(navigate).toHaveBeenCalledWith(['/activities', saved?.id]);
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(button(root, 'Importar GPX').disabled).toBe(false);
  });

  it('asks for the missing type, then retries with the choice without rereading the file', async () => {
    await flush(fixture);
    const xml = gpx();
    const text = jest.fn().mockResolvedValue(xml);
    const input = fileInput();
    selectFile(input, text);
    await flush(fixture);

    expect(input.value).toBe('');
    expect(root.textContent).toContain('¿Qué tipo de actividad es?');
    for (const label of ['Caminata', 'Bici', 'Correr', 'Cancelar']) expect(button(root, label)).toBeDefined();
    expect(executeImport).toHaveBeenNthCalledWith(1, { xml, fileName: 'costanera.gpx' });
    expect(root.querySelector('[role="alert"]')).toBeNull();
    expect(repo.save).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    button(root, 'Correr').click();
    await flush(fixture);

    expect(text).toHaveBeenCalledTimes(1);
    expect(executeImport).toHaveBeenCalledTimes(2);
    expect(executeImport).toHaveBeenNthCalledWith(2, { xml, fileName: 'costanera.gpx', type: 'run' });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save.mock.calls[0]?.[0].type).toBe('run');
    expect(navigate).toHaveBeenCalledWith(['/activities', repo.save.mock.calls[0]?.[0].id]);
    expect(root.textContent).not.toContain('¿Qué tipo de actividad es?');
  });

  it('cancels the type choice without storing anything or preventing another pick', async () => {
    await flush(fixture);
    const input = fileInput();
    const text = jest.fn().mockResolvedValue(gpx());
    selectFile(input, text);
    await flush(fixture);

    button(root, 'Cancelar').click();
    fixture.detectChanges();
    expect(root.textContent).not.toContain('¿Qué tipo de actividad es?');
    expect(repo.save).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(executeImport).toHaveBeenCalledTimes(1);
    expect(button(root, 'Importar GPX').disabled).toBe(false);

    selectFile(input, text);
    await flush(fixture);
    expect(root.textContent).toContain('¿Qué tipo de actividad es?');
    expect(text).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['<gpx>', 'costanera.gpx', 'GPX no válido: el XML no está bien formado'],
    [gpx('<type>cycling</type>'), '.gpx', 'Actividad no válida: el nombre no puede estar vacío'],
  ])('displays the exact domain error and does not save or navigate', async (xml, name, message) => {
    await flush(fixture);
    const input = fileInput();
    selectFile(input, () => Promise.resolve(xml), name);
    await flush(fixture);

    expect(root.querySelector('[role="alert"]')?.textContent?.trim()).toBe(message);
    expect(root.textContent).not.toContain('¿Qué tipo de actividad es?');
    expect(root.textContent).toContain('Todavía no importaste ningún recorrido');
    expect(repo.save).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(input.value).toBe('');
    expect(button(root, 'Importar GPX').disabled).toBe(false);
  });
});
