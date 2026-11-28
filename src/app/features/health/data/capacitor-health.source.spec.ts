import { CapacitorHealthSource } from './capacitor-health.source';

const plugin = { isAvailable: jest.fn(), requestAuthorization: jest.fn(), readSamples: jest.fn() };
jest.mock('@capgo/capacitor-health', () => ({ Health: plugin }), { virtual: false });

function setNative(native: boolean): void {
  (globalThis as { Capacitor?: unknown }).Capacitor = native ? { isNativePlatform: () => true } : undefined;
}

describe('CapacitorHealthSource', () => {
  const source = new CapacitorHealthSource();

  beforeEach(() => {
    Object.values(plugin).forEach((fn) => fn.mockReset());
    setNative(true);
  });
  afterAll(() => setNative(false));

  it('is unavailable on the web and never touches the plugin', async () => {
    setNative(false);
    await expect(source.isAvailable()).resolves.toBe(false);
    await expect(source.requestAccess()).resolves.toEqual([]);
    await expect(source.read('steps', 0, 1)).resolves.toEqual([]);
    expect(Object.values(plugin).every((fn) => fn.mock.calls.length === 0)).toBe(true);
  });

  it('is available when the native plugin says so', async () => {
    plugin.isAvailable.mockResolvedValue({ available: true });
    await expect(source.isAvailable()).resolves.toBe(true);
    plugin.isAvailable.mockResolvedValue({ available: false, reason: 'sin Health Connect' });
    await expect(source.isAvailable()).resolves.toBe(false);
  });

  it('is unavailable when the plugin fails to answer', async () => {
    plugin.isAvailable.mockRejectedValue(new Error('boom'));
    await expect(source.isAvailable()).resolves.toBe(false);
  });

  it('asks for read access with history and returns only the granted Forge metrics', async () => {
    plugin.requestAuthorization.mockResolvedValue({
      readAuthorized: ['steps', 'totalCalories', 'heartRate', 'weight'],
      readDenied: ['distance', 'oxygenSaturation'],
      writeAuthorized: [],
      writeDenied: [],
    });
    await expect(source.requestAccess()).resolves.toEqual(['steps', 'calories', 'heartRate']);
    expect(plugin.requestAuthorization).toHaveBeenCalledWith({
      read: ['steps', 'distance', 'totalCalories', 'heartRate', 'oxygenSaturation'],
      requestHistoryAccess: true,
    });
  });

  it('reads samples of the mapped type in the window and normalizes them', async () => {
    plugin.readSamples.mockResolvedValue({
      samples: [
        { dataType: 'totalCalories', value: 12.5, unit: 'kilocalorie', startDate: '2026-11-27T12:00:00.000Z', endDate: '2026-11-27T12:05:00.000Z', sourceId: 'com.yc.gloryfit' },
        { dataType: 'totalCalories', value: 3, unit: 'kilocalorie', startDate: '2026-11-27T13:00:00.000Z', endDate: '2026-11-27T13:05:00.000Z' },
      ],
    });
    const from = Date.UTC(2026, 10, 27);
    const to = Date.UTC(2026, 10, 28);
    await expect(source.read('calories', from, to)).resolves.toEqual([
      { startMs: Date.UTC(2026, 10, 27, 12), value: 12.5, sourceId: 'com.yc.gloryfit' },
      { startMs: Date.UTC(2026, 10, 27, 13), value: 3, sourceId: null },
    ]);
    expect(plugin.readSamples).toHaveBeenCalledWith({
      dataType: 'totalCalories',
      startDate: new Date(from).toISOString(),
      endDate: new Date(to).toISOString(),
      limit: 5000,
      ascending: true,
    });
  });
});
