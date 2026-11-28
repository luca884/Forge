import { TestBed } from '@angular/core/testing';
import { GLORYFIT_SOURCE_ID } from '../summarize-health-day';
import { HEALTH_METRICS, HealthSource, type HealthMetric, type HealthSample } from '../health-source';
import { HealthDayRepository } from '../health-day.repository';
import { SaveHealthDaysUseCase } from './save-health-days.use-case';
import { SyncHealthUseCase } from './sync-health.use-case';

const now = new Date(2026, 10, 28, 15, 30);
const local = (day: number, hour: number) => new Date(2026, 10, day, hour).getTime();

describe('SyncHealthUseCase', () => {
  const source = { isAvailable: jest.fn(), requestAccess: jest.fn(), read: jest.fn() };
  const repo = { saveMany: jest.fn(), listRange: jest.fn() };
  let reads: Partial<Record<HealthMetric, HealthSample[]>>;

  beforeEach(() => {
    reads = {};
    source.isAvailable.mockReset().mockResolvedValue(true);
    source.requestAccess.mockReset().mockResolvedValue([...HEALTH_METRICS]);
    source.read.mockReset().mockImplementation(async (metric: HealthMetric, fromMs: number, toMs: number) =>
      (reads[metric] ?? []).filter((s) => s.startMs >= fromMs && s.startMs < toMs),
    );
    repo.saveMany.mockReset().mockResolvedValue(undefined);
    repo.listRange.mockReset().mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        SyncHealthUseCase,
        SaveHealthDaysUseCase,
        { provide: HealthSource, useValue: source },
        { provide: HealthDayRepository, useValue: repo },
      ],
    });
  });

  const run = (days = 2) => TestBed.inject(SyncHealthUseCase).execute({ now, days });

  it('reports unavailable without asking for access, reading or saving anything', async () => {
    source.isAvailable.mockResolvedValue(false);
    await expect(run()).resolves.toEqual({ status: 'unavailable' });
    expect(source.requestAccess).not.toHaveBeenCalled();
    expect(source.read).not.toHaveBeenCalled();
    expect(repo.saveMany).not.toHaveBeenCalled();
  });

  it('reports denied when the user grants no metric, and reads nothing', async () => {
    source.requestAccess.mockResolvedValue([]);
    await expect(run()).resolves.toEqual({ status: 'denied' });
    expect(source.read).not.toHaveBeenCalled();
    expect(repo.saveMany).not.toHaveBeenCalled();
  });

  it('reads each granted metric once per day of the window, bounded by local midnights', async () => {
    await run(2);
    expect(source.read).toHaveBeenCalledTimes(HEALTH_METRICS.length * 2);
    expect(source.read).toHaveBeenCalledWith('steps', local(28, 0), local(29, 0));
    expect(source.read).toHaveBeenCalledWith('steps', local(27, 0), local(28, 0));
    expect(source.read).not.toHaveBeenCalledWith('steps', local(26, 0), expect.anything());
  });

  it('saves one summary per day that has data and skips empty days', async () => {
    reads = {
      steps: [{ startMs: local(27, 9), value: 4000, sourceId: GLORYFIT_SOURCE_ID }],
      heartRate: [{ startMs: local(27, 9), value: 70, sourceId: 'x' }],
    };
    await expect(run(2)).resolves.toEqual({ status: 'synced', days: 1, metrics: [...HEALTH_METRICS] });
    expect(repo.saveMany).toHaveBeenCalledTimes(1);
    expect(repo.saveMany).toHaveBeenCalledWith([
      { id: '2026-11-27', steps: 4000, distanceMeters: null, caloriesKcal: null, heartRate: { avg: 70, min: 70, max: 70, samples: 1 }, oxygenSaturation: null, syncedAt: now.getTime() },
    ]);
  });

  it('does not read metrics the user denied', async () => {
    source.requestAccess.mockResolvedValue(['steps']);
    reads = { steps: [{ startMs: local(28, 8), value: 10, sourceId: GLORYFIT_SOURCE_ID }], heartRate: [{ startMs: local(28, 8), value: 70, sourceId: 'x' }] };
    await expect(run(1)).resolves.toEqual({ status: 'synced', days: 1, metrics: ['steps'] });
    expect(source.read).toHaveBeenCalledTimes(1);
    expect(repo.saveMany).toHaveBeenCalledWith([expect.objectContaining({ steps: 10, heartRate: null })]);
  });

  it('keeps the stored values of metrics it could not read, so a revoked permission erases nothing', async () => {
    const storedHeartRate = { avg: 80, min: 60, max: 120, samples: 50 };
    repo.listRange.mockResolvedValue([
      { id: '2026-11-28', steps: 5, distanceMeters: 4, caloriesKcal: 3, heartRate: storedHeartRate, oxygenSaturation: null, syncedAt: 1 },
    ]);
    source.requestAccess.mockResolvedValue(['steps']);
    reads = { steps: [{ startMs: local(28, 8), value: 10, sourceId: GLORYFIT_SOURCE_ID }] };
    await expect(run(1)).resolves.toEqual({ status: 'synced', days: 1, metrics: ['steps'] });
    expect(repo.listRange).toHaveBeenCalledWith('2026-11-28', '2026-11-28');
    expect(repo.saveMany).toHaveBeenCalledWith([
      { id: '2026-11-28', steps: 10, distanceMeters: 4, caloriesKcal: 3, heartRate: storedHeartRate, oxygenSaturation: null, syncedAt: now.getTime() },
    ]);
  });

  it('saves nothing when the whole window is empty', async () => {
    await expect(run(3)).resolves.toEqual({ status: 'synced', days: 0, metrics: [...HEALTH_METRICS] });
    expect(repo.saveMany).not.toHaveBeenCalled();
  });

  it('is idempotent: syncing twice saves the same summaries', async () => {
    reads = { steps: [{ startMs: local(28, 8), value: 10, sourceId: GLORYFIT_SOURCE_ID }] };
    await run(1);
    await run(1);
    expect(repo.saveMany.mock.calls[0]).toEqual(repo.saveMany.mock.calls[1]);
  });

  it('propagates a read failure without saving a partial window', async () => {
    reads = { steps: [{ startMs: local(28, 8), value: 10, sourceId: GLORYFIT_SOURCE_ID }] };
    source.read.mockImplementation(async (metric: HealthMetric) => {
      if (metric === 'oxygenSaturation') throw new Error('fallo de lectura');
      return [];
    });
    await expect(run(1)).rejects.toThrow('fallo de lectura');
    expect(repo.saveMany).not.toHaveBeenCalled();
  });
});
