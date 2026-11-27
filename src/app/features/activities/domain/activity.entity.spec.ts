import { createActivity, InvalidActivityInputError, type Activity } from './activity.entity';

const activity: Activity = {
  id: 'import-1',
  name: '  Paseo  ',
  type: 'walk',
  startedAt: 1_000,
  points: [
    { lat: -90, lon: -180, ele: null, time: 1_000 },
    { lat: 90, lon: 180, ele: null, time: null },
  ],
  stats: {
    distanceMeters: 20_015_114,
    elapsedSeconds: null,
    movingSeconds: 0,
    avgSpeedKmh: null,
    elevationGainMeters: null,
  },
  importedAt: 2_000,
};

const point = { lat: 0, lon: 0, ele: null, time: null };

const invalidCases: { label: string; change: Partial<Activity>; reason: string }[] = [
  { label: 'empty name', change: { name: '' }, reason: 'el nombre no puede estar vacío' },
  { label: 'blank name', change: { name: ' \t ' }, reason: 'el nombre no puede estar vacío' },
  {
    label: 'zero points',
    change: { points: [] },
    reason: 'se necesitan al menos dos puntos',
  },
  {
    label: 'one point',
    change: { points: [point] },
    reason: 'se necesitan al menos dos puntos',
  },
  ...[-90.001, 90.001, NaN].map((lat) => ({
    label: `latitude ${lat}`,
    change: { points: [point, { ...point, lat }] },
    reason: 'la latitud debe estar entre -90 y 90',
  })),
  ...[-180.001, 180.001, NaN].map((lon) => ({
    label: `longitude ${lon}`,
    change: { points: [point, { ...point, lon }] },
    reason: 'la longitud debe estar entre -180 y 180',
  })),
];

function structuredActivity(input: Activity): Activity {
  return { ...input, points: input.points.map((p) => ({ ...p })), stats: { ...input.stats } };
}

describe('createActivity', () => {
  it('returns the valid activity unchanged, including boundary coordinates and name whitespace', () => {
    const input = structuredActivity(activity);
    expect(createActivity(input)).toStrictEqual(activity);
    expect(input).toStrictEqual(activity);
  });

  it.each(invalidCases)('rejects $label without changing the input', ({ change, reason }) => {
    const input = { ...activity, ...change };
    const before = structuredActivity(input);
    const create = () => createActivity(input);

    expect(create).toThrow(InvalidActivityInputError);
    expect(create).toThrow(new Error(`Actividad no válida: ${reason}`));
    expect(input).toStrictEqual(before);
  });
});
