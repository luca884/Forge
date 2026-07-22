/** Dashboard overview model — flat fields per design decision (reconciles nested spec). */
export interface DashboardOverview {
  readonly sessionsCurrent: number;
  readonly sessionsPrior: number;
  readonly sessionsDeltaPct: number | null;
  readonly setsCurrent: number;
  readonly setsPrior: number;
  readonly setsDeltaPct: number | null;
  readonly volumeCurrentKg: number;
  readonly volumePriorKg: number;
  readonly volumeDeltaPct: number | null;
}
