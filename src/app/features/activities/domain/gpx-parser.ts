import { DomainError } from '@core/shared/domain/errors/domain-error';
import type { ActivityType, TrackPoint } from './activity.entity';

export interface ParsedGpx {
  name: string | null;
  type: ActivityType | null;
  points: TrackPoint[];
}

export class InvalidGpxError extends DomainError {
  constructor(reason: string) {
    super(`GPX no válido: ${reason}`, 'InvalidGpxError');
  }
}

const activityTypes = new Map<string, ActivityType>([
  ['walking', 'walk'],
  ['walk', 'walk'],
  ['hiking', 'walk'],
  ['hike', 'walk'],
  ['cycling', 'bike'],
  ['biking', 'bike'],
  ['bike', 'bike'],
  ['ride', 'bike'],
  ['mtb', 'bike'],
  ['running', 'run'],
  ['run', 'run'],
  ['trail running', 'run'],
]);

const isoDateTime = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

export function parseGpx(xml: string): ParsedGpx {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (
    document.getElementsByTagNameNS('http://www.mozilla.org/newlayout/xml/parsererror.xml', 'parsererror').length ||
    document.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'parsererror').length
  ) {
    throw new InvalidGpxError('el XML no está bien formado');
  }

  const root = document.documentElement;
  if (root.localName !== 'gpx') {
    throw new InvalidGpxError('el elemento raíz debe ser gpx');
  }

  const tracks = childrenNamed(root, 'trk');
  const points: TrackPoint[] = [];
  for (const track of tracks) {
    for (const segment of childrenNamed(track, 'trkseg')) {
      for (const element of childrenNamed(segment, 'trkpt')) {
        points.push(parsePoint(element));
      }
    }
  }
  if (points.length === 0) {
    throw new InvalidGpxError('no contiene puntos de recorrido');
  }

  const name = firstText(tracks, 'name') ?? firstText(childrenNamed(root, 'metadata'), 'name');
  const rawType = firstText(tracks, 'type');
  return { name, type: activityTypes.get(rawType?.toLowerCase() ?? '') ?? null, points };
}

function childrenNamed(parent: Element, name: string): Element[] {
  return Array.from(parent.children).filter(
    (child) => child.localName === name && child.namespaceURI === parent.namespaceURI,
  );
}

function firstText(parents: Element[], name: string): string | null {
  for (const parent of parents) {
    const text = childrenNamed(parent, name)[0]?.textContent?.trim();
    if (text) return text;
  }
  return null;
}

function parseNumber(text: string | null): number | null {
  if (text === null || text.trim() === '') return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function parseTime(text: string | null): number | null {
  if (text === null || !isoDateTime.test(text)) return null;
  const time = Date.parse(text);
  return Number.isFinite(time) ? time : null;
}

function parsePoint(element: Element): TrackPoint {
  const lat = parseNumber(element.getAttribute('lat'));
  const lon = parseNumber(element.getAttribute('lon'));
  if (lat === null || lon === null) {
    throw new InvalidGpxError('hay un punto con latitud o longitud no válida');
  }
  return {
    lat,
    lon,
    ele: parseNumber(firstText([element], 'ele')),
    time: parseTime(firstText([element], 'time')),
  };
}
