import { TestBed } from '@angular/core/testing';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import type { Activity } from '../domain/activity.entity';
import { ActivityRepository } from '../domain/activity.repository';
import { ImportActivityUseCase } from '../domain/use-cases/import-activity.use-case';
import { DexieActivityRepository } from './dexie-activity.repository';

jest.mock('@core/shared/utils/uuid', () => ({ generateUUID: () => 'e7727f1a-d0a4-41cc-9c32-05d749cb8a79' }));

const points = [{ lat: 0, lon: 0, ele: 4, time: 0 }, { lat: 0, lon: 0.001, ele: null, time: null }];
const stats = { distanceMeters: 111, elapsedSeconds: null, movingSeconds: 0, avgSpeedKmh: null, elevationGainMeters: null };
const activity: Activity = { id: 'a', name: 'Paseo', type: 'walk', startedAt: 0, importedAt: 3000, points, stats };
const { points: _points, ...summary } = activity;

describe('DexieActivityRepository', () => {
  let db: ForgeDatabaseService;
  let repo: ActivityRepository;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [ForgeDatabaseService, ImportActivityUseCase, { provide: ActivityRepository, useClass: DexieActivityRepository }],
    });
    db = TestBed.inject(ForgeDatabaseService);
    repo = TestBed.inject(ActivityRepository);
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  it('saves and retrieves both parts, and upserts both on repeated saves', async () => {
    await repo.save(activity);
    expect(await db.activities.get(activity.id)).toEqual(summary);
    expect(await db.activityTracks.get(activity.id)).toEqual({ activityId: activity.id, points });
    expect(await repo.getById(activity.id)).toEqual(activity);

    const changed = { ...activity, name: 'Otro paseo', points: [...points].reverse() };
    await repo.save(changed);
    expect(await repo.getById(activity.id)).toEqual(changed);
    expect(await db.activities.count()).toBe(1);
    expect(await db.activityTracks.count()).toBe(1);
  });

  it('lists summaries newest first using startedAt or importedAt, without reading tracks', async () => {
    const untimed = { ...summary, id: 'b', startedAt: null, importedAt: 1000 };
    const newest = { ...summary, id: 'c', startedAt: 2000, importedAt: 2500 };
    await repo.save({ ...untimed, points });
    await repo.save(activity);
    await repo.save({ ...newest, points });
    const readTrack = jest.fn();
    db.activityTracks.hook('reading', readTrack);

    expect(await db.transaction('r', db.activities, () => repo.list())).toEqual([newest, untimed, summary]);
    expect(readTrack).not.toHaveBeenCalled();
  });

  it('deletes both parts; a missing id returns null and deleting it changes nothing', async () => {
    const other = { ...activity, id: 'b' };
    await repo.save(activity);
    await repo.save(other);
    await repo.delete(activity.id);
    expect(await repo.getById(activity.id)).toBeNull();
    expect(await db.activities.get(activity.id)).toBeUndefined();
    expect(await db.activityTracks.get(activity.id)).toBeUndefined();

    await repo.delete(activity.id);
    expect(await repo.getById(other.id)).toEqual(other);
    expect(await db.activities.count()).toBe(1);
    expect(await db.activityTracks.count()).toBe(1);
  });

  it('rolls back the metadata if saving the track fails', async () => {
    db.activityTracks.hook('creating', () => { throw new Error('fallo de escritura'); });
    await expect(repo.save(activity)).rejects.toThrow('fallo de escritura');
    expect(await db.activities.count()).toBe(0);
    expect(await db.activityTracks.count()).toBe(0);
  });

  it('rolls back deleting metadata if deleting the track fails', async () => {
    await repo.save(activity);
    db.activityTracks.hook('deleting', () => { throw new Error('fallo de borrado'); });
    await expect(repo.delete(activity.id)).rejects.toThrow('fallo de borrado');
    expect(await db.activities.get(activity.id)).toEqual(summary);
    expect(await db.activityTracks.get(activity.id)).toEqual({ activityId: activity.id, points });
  });

  it.each([
    ['<gpx>', 'GPX no válido: el XML no está bien formado'],
    ['<gpx><trk><trkseg><trkpt lat="0" lon="0"/></trkseg></trk></gpx>', 'Actividad no válida: se necesitan al menos dos puntos'],
  ])('leaves both stores unchanged on rejected GPX: %s', async (xml, message) => {
    await repo.save(activity);
    const useCase = TestBed.inject(ImportActivityUseCase);

    await expect(useCase.execute({ xml, fileName: 'paseo.gpx', type: 'walk' })).rejects.toThrow(message);
    expect(await db.activities.toArray()).toEqual([summary]);
    expect(await db.activityTracks.toArray()).toEqual([{ activityId: activity.id, points }]);
  });
});
