import { TestBed } from '@angular/core/testing';
import type { Activity } from '../activity.entity';
import { ActivityRepository, type ActivitySummary } from '../activity.repository';
import { ActivityNotFoundError } from '../errors/activity-not-found.error';
import { ActivityTypeRequiredError } from '../errors/activity-type-required.error';
import { DeleteActivityUseCase } from './delete-activity.use-case';
import { GetActivityUseCase } from './get-activity.use-case';
import { ImportActivityUseCase } from './import-activity.use-case';
import { ListActivitiesUseCase } from './list-activities.use-case';

jest.mock('@core/shared/utils/uuid', () => ({ generateUUID: () => 'e7727f1a-d0a4-41cc-9c32-05d749cb8a79' }));

const points = [
  { lat: 0, lon: 0, ele: null, time: null },
  { lat: 0, lon: 0, ele: 10, time: 0 },
  { lat: 0, lon: 0.001, ele: 13, time: 10_000 },
];
const importedAt = 42_000;
const activity: Activity = {
  id: 'e7727f1a-d0a4-41cc-9c32-05d749cb8a79',
  name: 'Mi recorrido',
  type: 'bike',
  points,
  startedAt: 0,
  importedAt,
  stats: {
    distanceMeters: 111.195,
    elapsedSeconds: null,
    movingSeconds: 10,
    avgSpeedKmh: 40.03,
    elevationGainMeters: 3,
  },
};
const { points: _points, ...summary } = activity;
const trackPoints = `
  <trkpt lat="0" lon="0"/>
  <trkpt lat="0" lon="0"><ele>10</ele><time>1970-01-01T00:00:00Z</time></trkpt>
  <trkpt lat="0" lon="0.001"><ele>13</ele><time>1970-01-01T00:00:10Z</time></trkpt>`;

function gpx(trackMetadata = '', body = trackPoints): string {
  return `<gpx><trk>${trackMetadata}<trkseg>${body}</trkseg></trk></gpx>`;
}

class StubActivityRepository extends ActivityRepository {
  override save = jest.fn<Promise<void>, [Activity]>().mockResolvedValue(undefined);
  override list = jest.fn<Promise<ActivitySummary[]>, []>().mockResolvedValue([summary]);
  override getById = jest.fn<Promise<Activity | null>, [string]>().mockResolvedValue(activity);
  override delete = jest.fn<Promise<void>, [string]>().mockResolvedValue(undefined);
}

describe('activity use cases', () => {
  let repo: StubActivityRepository;
  let importActivity: ImportActivityUseCase;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImportActivityUseCase, ListActivitiesUseCase, GetActivityUseCase, DeleteActivityUseCase,
        { provide: ActivityRepository, useClass: StubActivityRepository }],
    });
    repo = TestBed.inject(ActivityRepository) as StubActivityRepository;
    importActivity = TestBed.inject(ImportActivityUseCase);
    jest.spyOn(Date, 'now').mockReturnValue(importedAt);
  });

  afterEach(() => jest.restoreAllMocks());

  it('imports trimmed GPX metadata, the time of the first timed point, and computed stats', async () => {
    const xml = gpx('<name> Mi recorrido </name><type>cycling</type>');
    const saved = await importActivity.execute({ xml, fileName: 'ignorado.gpx' });

    expect(saved).toEqual({
      ...activity,
      stats: {
        ...activity.stats,
        distanceMeters: expect.closeTo(111.195),
        avgSpeedKmh: expect.closeTo(40.03),
      },
    });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(saved);
  });

  it('uses the explicit type over the GPX type, the base filename for a blank name and null without times', async () => {
    const xml = gpx('<name>   </name><type>cycling</type>', '<trkpt lat="0" lon="0"/><trkpt lat="0" lon="0.001"/>');
    const saved = await importActivity.execute({ xml, fileName: 'paseo.8.gpx', type: 'run' });

    expect(saved).toEqual({
      ...activity,
      name: 'paseo.8',
      type: 'run',
      startedAt: null,
      points: [{ lat: 0, lon: 0, ele: null, time: null }, { lat: 0, lon: 0.001, ele: null, time: null }],
      stats: { distanceMeters: expect.closeTo(111.195), elapsedSeconds: null, movingSeconds: null, avgSpeedKmh: null, elevationGainMeters: null },
    });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(saved);
  });

  it.each(['', '<type>navegación</type>'])('asks for a type when missing or unknown (%s) and does not save', async (metadata) => {
    await expect(importActivity.execute({ xml: gpx(metadata), fileName: 'paseo.gpx' })).rejects.toBeInstanceOf(ActivityTypeRequiredError);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('accepts the supplied type when GPX has none and keeps a filename with no extension', async () => {
    const saved = await importActivity.execute({ xml: gpx(), fileName: 'paseo', type: 'walk' });
    expect(saved).toEqual({
      ...activity,
      name: 'paseo',
      type: 'walk',
      stats: { ...activity.stats, distanceMeters: expect.closeTo(111.195), avgSpeedKmh: expect.closeTo(40.03) },
    });
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(saved);
  });

  it.each([
    ['<gpx>', 'paseo.gpx', 'GPX no válido: el XML no está bien formado'],
    [gpx('', '<trkpt lat="0" lon="0"/>'), 'paseo.gpx', 'Actividad no válida: se necesitan al menos dos puntos'],
    [gpx(), '.gpx', 'Actividad no válida: el nombre no puede estar vacío'],
  ])('does not save rejected input: %s (%s)', async (xml, fileName, message) => {
    await expect(importActivity.execute({ xml, fileName, type: 'walk' })).rejects.toThrow(message);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('lists activity summaries', async () => {
    expect(await TestBed.inject(ListActivitiesUseCase).execute()).toEqual([summary]);
    expect(repo.list).toHaveBeenCalledTimes(1);
  });

  it('gets an activity including its points', async () => {
    expect(await TestBed.inject(GetActivityUseCase).execute(activity.id)).toBe(activity);
    expect(repo.getById).toHaveBeenCalledWith(activity.id);
  });

  it('throws a domain error for a missing activity', async () => {
    repo.getById.mockResolvedValueOnce(null);
    await expect(TestBed.inject(GetActivityUseCase).execute('missing')).rejects.toBeInstanceOf(ActivityNotFoundError);
    expect(repo.getById).toHaveBeenCalledWith('missing');
  });

  it('deletes the activity by id', async () => {
    await expect(TestBed.inject(DeleteActivityUseCase).execute(activity.id)).resolves.toBeUndefined();
    expect(repo.delete).toHaveBeenCalledTimes(1);
    expect(repo.delete).toHaveBeenCalledWith(activity.id);
  });
});
