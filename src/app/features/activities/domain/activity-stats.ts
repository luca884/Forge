import type { ActivityStats, TrackPoint } from './activity.entity';

const earthRadiusMeters = 6_371_008.8;
const radiansPerDegree = Math.PI / 180;
const minMovingSpeed = 0.5;
const elevationHysteresisMeters = 2;

export function computeStats(points: TrackPoint[]): ActivityStats {
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length < 2 || !first || !last) {
    return {
      distanceMeters: 0,
      elapsedSeconds: null,
      movingSeconds: null,
      avgSpeedKmh: null,
      elevationGainMeters: null,
    };
  }

  let distanceMeters = 0;
  let movingMeters = 0;
  let movingSeconds = 0;
  let hasTime = false;
  let previous: TrackPoint | undefined;
  for (const point of points) {
    hasTime ||= point.time !== null;
    if (previous) {
      const meters = haversineMeters(previous, point);
      distanceMeters += meters;
      if (previous.time !== null && point.time !== null) {
        const seconds = (point.time - previous.time) / 1000;
        if (seconds > 0 && meters / seconds >= minMovingSpeed) {
          movingSeconds += seconds;
          movingMeters += meters;
        }
      }
    }
    previous = point;
  }

  return {
    distanceMeters,
    elapsedSeconds: first.time !== null && last.time !== null ? (last.time - first.time) / 1000 : null,
    movingSeconds: hasTime ? movingSeconds : null,
    avgSpeedKmh: movingSeconds > 0 ? (movingMeters / movingSeconds) * 3.6 : null,
    elevationGainMeters: elevationGain(points),
  };
}

function haversineMeters(from: TrackPoint, to: TrackPoint): number {
  const deltaLat = (to.lat - from.lat) * radiansPerDegree;
  const deltaLon = (to.lon - from.lon) * radiansPerDegree;
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(from.lat * radiansPerDegree) *
      Math.cos(to.lat * radiansPerDegree) *
      Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

function elevationGain(points: TrackPoint[]): number | null {
  let reference: number | null = null;
  let gain: number | null = null;
  for (const { ele } of points) {
    if (ele === null) continue;
    if (reference === null) {
      reference = ele;
      continue;
    }
    gain ??= 0;
    const delta = ele - reference;
    // La referencia solo cambia cuando el desnivel supera el ruido en cualquier dirección.
    if (Math.abs(delta) > elevationHysteresisMeters) {
      gain += Math.max(delta, 0);
      reference = ele;
    }
  }
  return gain;
}
