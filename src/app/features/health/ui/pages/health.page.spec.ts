import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { HealthDay } from '../../domain/health-day.entity';
import { HealthDayRepository } from '../../domain/health-day.repository';
import { HealthSource } from '../../domain/health-source';
import { localDayId } from '../../domain/local-day';
import { GetHealthDayUseCase } from '../../domain/use-cases/get-health-day.use-case';
import { SaveHealthDaysUseCase } from '../../domain/use-cases/save-health-days.use-case';
import { SyncHealthUseCase, type SyncHealthResult } from '../../domain/use-cases/sync-health.use-case';
import { HealthPage } from './health.page';

const today: Omit<HealthDay, 'id'> = {
  steps: 8123,
  distanceMeters: 6100,
  caloriesKcal: 2210,
  heartRate: { avg: 72, min: 51, max: 130, samples: 96 },
  oxygenSaturation: { avg: 97, min: 94, max: 99, samples: 12 },
  syncedAt: 1,
};

async function flush(fixture: ComponentFixture<HealthPage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await new Promise<void>((resolve) => setTimeout(resolve));
  fixture.detectChanges();
}

/**
 * A rejected jest mock created in the same turn surfaces as an uncaught error under zone.js before
 * the page's catch runs (see profile.page.spec.ts). Rejecting after a task turn attaches the handler first.
 */
function rejectLater<T>(error: Error): Promise<T> {
  return new Promise<T>((_resolve, reject) => setTimeout(() => reject(error)));
}

describe('HealthPage', () => {
  const repo = { saveMany: jest.fn(), listRange: jest.fn() };
  const source = { isAvailable: jest.fn(), requestAccess: jest.fn(), read: jest.fn() };
  const sync = { execute: jest.fn() };
  let stored: Omit<HealthDay, 'id'> | null;

  async function open(): Promise<{ fixture: ComponentFixture<HealthPage>; el: HTMLElement }> {
    const fixture = TestBed.createComponent(HealthPage);
    await flush(fixture);
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }
  const button = (el: HTMLElement) => Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Sincronizar'));

  beforeEach(() => {
    stored = today;
    repo.listRange.mockReset().mockImplementation(async (from: string) => (stored ? [{ id: from, ...stored }] : []));
    source.isAvailable.mockReset().mockResolvedValue(true);
    sync.execute.mockReset().mockResolvedValue({ status: 'synced', days: 3, metrics: [] } satisfies SyncHealthResult);
    TestBed.configureTestingModule({
      providers: [
        GetHealthDayUseCase,
        SaveHealthDaysUseCase,
        { provide: SyncHealthUseCase, useValue: sync },
        { provide: HealthDayRepository, useValue: repo },
        { provide: HealthSource, useValue: source },
      ],
    });
  });

  it("shows today's stored values", async () => {
    const { el } = await open();
    const todayId = localDayId(new Date());
    expect(repo.listRange).toHaveBeenCalledWith(todayId, todayId);
    const text = el.textContent ?? '';
    expect(text).toContain('Salud');
    expect(text).toContain('8.123');
    expect(text).toContain('6,1 km');
    expect(text).toContain('2.210 kcal');
    expect(text).toContain('72 lpm');
    expect(text).toContain('51–130 lpm');
    expect(text).toContain('97 %');
  });

  it('shows dashes and a hint when there is nothing stored for today', async () => {
    stored = null;
    const { el } = await open();
    expect(el.textContent).toContain('Todavía no hay datos de hoy');
    expect(el.querySelectorAll('dd')[0]?.textContent?.trim()).toBe('—');
  });

  it('shows an error when the stored data cannot be read', async () => {
    repo.listRange.mockImplementation(() => rejectLater(new Error('db')));
    const { el } = await open();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron cargar los datos de salud.');
  });

  it('on the web, or without Health Connect, explains it and offers no sync button', async () => {
    source.isAvailable.mockResolvedValue(false);
    const { el } = await open();
    expect(button(el)).toBeUndefined();
    expect(el.textContent).toContain('solo funciona en la app de Android con Health Connect');
    expect(el.textContent).toContain('8.123');
  });

  it('syncs 7 days when today already has data, then reloads and reports', async () => {
    const { fixture, el } = await open();
    stored = { ...today, steps: 9000 };
    button(el)?.click();
    await flush(fixture);
    expect(sync.execute).toHaveBeenCalledWith({ now: expect.any(Date), days: 7 });
    expect(el.textContent).toContain('9.000');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Sincronizado: 3 días.');
  });

  it('syncs 30 days the first time, when today has no data', async () => {
    stored = null;
    const { fixture, el } = await open();
    button(el)?.click();
    await flush(fixture);
    expect(sync.execute).toHaveBeenCalledWith({ now: expect.any(Date), days: 30 });
  });

  it.each<[string, SyncHealthResult, string]>([
    ['unavailable', { status: 'unavailable' }, 'Health Connect no está disponible en este dispositivo.'],
    ['denied', { status: 'denied' }, 'No diste permiso para leer Health Connect.'],
    ['an empty window', { status: 'synced', days: 0, metrics: [] }, 'No hay datos nuevos en Health Connect.'],
    ['a single day', { status: 'synced', days: 1, metrics: [] }, 'Sincronizado: 1 día.'],
  ])('reports %s', async (_case, result, message) => {
    sync.execute.mockResolvedValue(result);
    const { fixture, el } = await open();
    button(el)?.click();
    await flush(fixture);
    expect(el.textContent).toContain(message);
  });

  it('reports a failed sync without losing the stored data', async () => {
    sync.execute.mockImplementation(() => rejectLater(new Error('boom')));
    const { fixture, el } = await open();
    button(el)?.click();
    await flush(fixture);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('No se pudo sincronizar. Probá de nuevo.');
    expect(el.textContent).toContain('8.123');
  });

  it('disables the button while a sync is running', async () => {
    let finish: (r: SyncHealthResult) => void = () => undefined;
    sync.execute.mockReturnValue(new Promise<SyncHealthResult>((resolve) => (finish = resolve)));
    const { fixture, el } = await open();
    button(el)?.click();
    fixture.detectChanges();
    expect(button(el)?.disabled).toBe(true);
    finish({ status: 'synced', days: 0, metrics: [] });
    await flush(fixture);
    expect(button(el)?.disabled).toBe(false);
  });
});
