import { DashboardOverview } from './dashboard-overview.model';

describe('DashboardOverview model', () => {
  it('accepts a fully populated overview shape', () => {
    const overview: DashboardOverview = {
      sessionsCurrent: 12,
      sessionsPrior: 10,
      sessionsDeltaPct: 20,
      setsCurrent: 80,
      setsPrior: 70,
      setsDeltaPct: 14.29,
      volumeCurrentKg: 4500,
      volumePriorKg: 4000,
      volumeDeltaPct: 12.5,
    };
    expect(overview.sessionsCurrent).toBe(12);
    expect(overview.volumeDeltaPct).toBe(12.5);
  });

  it('allows null deltas when prior period is zero', () => {
    const overview: DashboardOverview = {
      sessionsCurrent: 5,
      sessionsPrior: 0,
      sessionsDeltaPct: null,
      setsCurrent: 30,
      setsPrior: 0,
      setsDeltaPct: null,
      volumeCurrentKg: 2000,
      volumePriorKg: 0,
      volumeDeltaPct: null,
    };
    expect(overview.sessionsDeltaPct).toBeNull();
    expect(overview.setsDeltaPct).toBeNull();
    expect(overview.volumeDeltaPct).toBeNull();
  });
});
