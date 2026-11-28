import { GLORYFIT_SOURCE_ID, summarizeHealthDay, type DaySamples } from './summarize-health-day';
import type { HealthSample } from './health-source';

const at = (hour: number) => new Date(2026, 10, 27, hour).getTime();
const sample = (hour: number, value: number, sourceId: string | null = GLORYFIT_SOURCE_ID): HealthSample => ({ startMs: at(hour), value, sourceId });
const none: DaySamples = { steps: [], distance: [], calories: [], heartRate: [], oxygenSaturation: [] };
const summarize = (samples: Partial<DaySamples>) => summarizeHealthDay('2026-11-27', { ...none, ...samples }, 99);

describe('summarizeHealthDay', () => {
  it('returns null when the day has no usable sample', () => {
    expect(summarize({})).toBeNull();
  });

  it('sums steps, distance and calories from GloryFit', () => {
    const day = summarize({
      steps: [sample(8, 1000), sample(9, 2500)],
      distance: [sample(8, 700.5), sample(9, 1800)],
      calories: [sample(8, 40), sample(9, 60.5)],
    });
    expect(day).toEqual({ id: '2026-11-27', steps: 3500, distanceMeters: 2500.5, caloriesKcal: 100.5, heartRate: null, oxygenSaturation: null, syncedAt: 99 });
  });

  it('rounds a fractional step total to the nearest whole step and keeps distance and calories as they are', () => {
    const day = summarize({
      steps: [sample(8, 10.5), sample(9, 2000.25)],
      distance: [sample(8, 700.5)],
      calories: [sample(8, 40.25)],
    });
    expect(day).toEqual({ id: '2026-11-27', steps: 2011, distanceMeters: 700.5, caloriesKcal: 40.25, heartRate: null, oxygenSaturation: null, syncedAt: 99 });
  });

  it('ignores steps, distance and calories from other sources, so totals are not counted three times', () => {
    const day = summarize({
      steps: [sample(8, 1000), sample(8, 5000, 'com.sec.android.app.shealth'), sample(8, 400, null)],
      distance: [sample(8, 10, 'android')],
    });
    expect(day?.steps).toBe(1000);
    expect(day?.distanceMeters).toBeNull();
  });

  it('keeps a zero total from GloryFit as data, not as missing', () => {
    expect(summarize({ steps: [sample(8, 0)] })?.steps).toBe(0);
  });

  it('summarizes heart rate and oxygen saturation from any source', () => {
    const day = summarize({
      heartRate: [sample(8, 60, 'a'), sample(9, 90, 'b'), sample(10, 72, null)],
      oxygenSaturation: [sample(8, 96), sample(9, 98)],
    });
    expect(day?.heartRate).toEqual({ avg: 74, min: 60, max: 90, samples: 3 });
    expect(day?.oxygenSaturation).toEqual({ avg: 97, min: 96, max: 98, samples: 2 });
  });

  it('assigns a sample to the day it starts in and drops those that start in another day', () => {
    const outside = { startMs: new Date(2026, 10, 28, 0, 0).getTime(), value: 777, sourceId: GLORYFIT_SOURCE_ID };
    const before = { startMs: new Date(2026, 10, 26, 23, 59).getTime(), value: 555, sourceId: GLORYFIT_SOURCE_ID };
    expect(summarize({ steps: [sample(8, 100), outside, before] })?.steps).toBe(100);
  });

  it('ignores samples with a negative or non-finite value', () => {
    const day = summarize({ steps: [sample(8, 100), sample(9, -5), sample(10, Number.NaN)], heartRate: [sample(8, Number.NaN)] });
    expect(day?.steps).toBe(100);
    expect(day?.heartRate).toBeNull();
  });
});
