export type TrackingType =
  | 'weight-reps'
  | 'bodyweight-reps'
  | 'time'
  | 'distance-time';

export function assertNever(x: never): never {
  throw new Error(`Unhandled discriminated union member: ${JSON.stringify(x)}`);
}
