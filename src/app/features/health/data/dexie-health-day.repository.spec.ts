import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import type { HealthDay } from '../domain/health-day.entity';
import { HealthDayRepository } from '../domain/health-day.repository';
import { DexieHealthDayRepository } from './dexie-health-day.repository';

const day = (id: string, change: Partial<HealthDay> = {}): HealthDay => ({
  id,
  steps: 1000,
  distanceMeters: 800,
  caloriesKcal: 2000,
  heartRate: { avg: 72, min: 51, max: 130, samples: 96 },
  oxygenSaturation: null,
  syncedAt: 5,
  ...change,
});

describe('DexieHealthDayRepository', () => {
  let db: ForgeDatabaseService;
  let repo: HealthDayRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [ForgeDatabaseService, { provide: HealthDayRepository, useClass: DexieHealthDayRepository }],
    });
    db = TestBed.inject(ForgeDatabaseService);
    repo = TestBed.inject(HealthDayRepository);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('stores days keyed by their id and lists an inclusive range oldest first', async () => {
    await repo.saveMany([day('2026-11-28'), day('2026-11-26'), day('2026-11-27'), day('2026-11-20')]);
    const found = await repo.listRange('2026-11-26', '2026-11-28');
    expect(found.map((d) => d.id)).toEqual(['2026-11-26', '2026-11-27', '2026-11-28']);
    expect(found[0]).toEqual(day('2026-11-26'));
    expect(await db.healthDaily.count()).toBe(4);
  });

  it('replaces a day that is saved again instead of duplicating it', async () => {
    await repo.saveMany([day('2026-11-27')]);
    await repo.saveMany([day('2026-11-27', { steps: 4321, heartRate: null, syncedAt: 9 })]);
    expect(await db.healthDaily.count()).toBe(1);
    expect(await repo.listRange('2026-11-27', '2026-11-27')).toEqual([day('2026-11-27', { steps: 4321, heartRate: null, syncedAt: 9 })]);
  });

  it('returns an empty list for an empty range and saves nothing for an empty batch', async () => {
    await repo.saveMany([]);
    expect(await repo.listRange('2026-11-01', '2026-11-30')).toEqual([]);
  });
});
