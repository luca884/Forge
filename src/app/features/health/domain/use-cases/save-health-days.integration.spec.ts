import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { DexieHealthDayRepository } from '../../data/dexie-health-day.repository';
import { InvalidHealthDayInputError, type HealthDay } from '../health-day.entity';
import { HealthDayRepository } from '../health-day.repository';
import { SaveHealthDaysUseCase } from './save-health-days.use-case';

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

describe('SaveHealthDaysUseCase with the Dexie repository', () => {
  let db: ForgeDatabaseService;
  let saveDays: SaveHealthDaysUseCase;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        ForgeDatabaseService,
        SaveHealthDaysUseCase,
        { provide: HealthDayRepository, useClass: DexieHealthDayRepository },
      ],
    });
    db = TestBed.inject(ForgeDatabaseService);
    saveDays = TestBed.inject(SaveHealthDaysUseCase);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await db.delete();
  });

  it('rejects a batch with one invalid day and leaves the stored days unchanged', async () => {
    await saveDays.execute([day('2026-11-27')]);

    await expect(
      saveDays.execute([day('2026-11-27', { steps: 99 }), day('2026-11-28', { steps: -1 })]),
    ).rejects.toThrow(InvalidHealthDayInputError);

    expect(await db.healthDaily.toArray()).toEqual([day('2026-11-27')]);
  });
});
