/** Single point in the weekly volume trend. */
export interface WeeklyTrendPoint {
  /** ISO date YYYY-MM-DD of the Monday starting this ISO week. */
  readonly weekStart: string;
  readonly volumeKg: number;
  readonly sessions: number;
}
