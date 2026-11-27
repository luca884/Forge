import { InvalidGpxError, parseGpx } from './gpx-parser';

const trackPoint = '<trkpt lat="0" lon="0"/>';

function gpxWithPoint(point: string, trackFields = ''): string {
  return `<gpx><trk>${trackFields}<trkseg>${point}</trkseg></trk></gpx>`;
}

describe('parseGpx', () => {
  it('reads namespaced tracks and segments in order, with optional elevation and time', () => {
    const gpx = `<gpx xmlns="http://www.topografix.com/GPX/1/1">
      <metadata><name>Nombre alternativo</name></metadata>
      <trk>
        <name> Paseo </name><type> HIKE </type>
        <trkseg>
          <trkpt lat="-34.1" lon="-58.1"><ele>0</ele><time>2026-01-02T03:04:05.250Z</time></trkpt>
          <trkpt lat="-34.2" lon="-58.2"/>
        </trkseg>
        <trkseg>
          <trkpt lat="-34.3" lon="-58.3"><ele>mal</ele><time>no es una fecha</time></trkpt>
        </trkseg>
      </trk>
      <trk>
        <name>Segundo</name><type>bike</type>
        <trkseg>
          <trkpt lat="-34.4" lon="-58.4"><ele>12.5</ele><time>2026-01-02T04:05:06+01:00</time></trkpt>
        </trkseg>
      </trk>
    </gpx>`;

    expect(parseGpx(gpx)).toStrictEqual({
      name: 'Paseo',
      type: 'walk',
      points: [
        { lat: -34.1, lon: -58.1, ele: 0, time: Date.UTC(2026, 0, 2, 3, 4, 5, 250) },
        { lat: -34.2, lon: -58.2, ele: null, time: null },
        { lat: -34.3, lon: -58.3, ele: null, time: null },
        { lat: -34.4, lon: -58.4, ele: 12.5, time: Date.UTC(2026, 0, 2, 3, 5, 6) },
      ],
    });
  });

  it('falls back to the metadata name and does not require optional fields', () => {
    expect(
      parseGpx(`<gpx><metadata><name>Desde metadata</name></metadata>
        <trk><trkseg>${trackPoint}</trkseg></trk></gpx>`),
    ).toStrictEqual({
      name: 'Desde metadata',
      type: null,
      points: [{ lat: 0, lon: 0, ele: null, time: null }],
    });
  });

  it('uses the first track name present before falling back to metadata', () => {
    const xml = `<gpx><metadata><name>Metadata</name></metadata>
      <trk><trkseg>${trackPoint}</trkseg></trk>
      <trk><name>Segundo</name></trk>
      <trk><name>Tercero</name></trk>
    </gpx>`;
    expect(parseGpx(xml).name).toBe('Segundo');
  });

  it('returns null when no name is present', () => {
    expect(parseGpx(gpxWithPoint(trackPoint)).name).toBeNull();
  });

  it('treats empty fields and non-ISO time text as missing', () => {
    const xml = gpxWithPoint('<trkpt lat="0" lon="0"><ele> </ele><time>123</time></trkpt>');
    expect(parseGpx(xml).points).toStrictEqual([{ lat: 0, lon: 0, ele: null, time: null }]);
  });

  it.each([
    ['WaLkInG', 'walk'],
    ['walk', 'walk'],
    ['hiking', 'walk'],
    ['hike', 'walk'],
    ['cycling', 'bike'],
    ['biking', 'bike'],
    ['bike', 'bike'],
    ['ride', 'bike'],
    ['MTB', 'bike'],
    ['running', 'run'],
    ['run', 'run'],
    ['TRAIL RUNNING', 'run'],
    ['swimming', null],
    ['', null],
  ])('maps track type %j to %j', (rawType, expectedType) => {
    expect(parseGpx(gpxWithPoint(trackPoint, `<type>${rawType}</type>`)).type).toBe(expectedType);
  });

  it.each([
    ['malformed XML', '<gpx><trk></gpx>', 'el XML no está bien formado'],
    ['wrong root', '<route/>', 'el elemento raíz debe ser gpx'],
    ['zero track points', '<gpx><trk><trkseg/></trk><wpt lat="0" lon="0"/></gpx>', 'no contiene puntos de recorrido'],
    ['missing lat', gpxWithPoint('<trkpt lon="0"/>'), 'hay un punto con latitud o longitud no válida'],
    ['missing lon', gpxWithPoint('<trkpt lat="0"/>'), 'hay un punto con latitud o longitud no válida'],
    ['bad lat', gpxWithPoint(`${trackPoint}<trkpt lat="NaN" lon="0"/>`), 'hay un punto con latitud o longitud no válida'],
    ['bad lon', gpxWithPoint('<trkpt lat="0" lon="1abc"/>'), 'hay un punto con latitud o longitud no válida'],
    ['blank lat', gpxWithPoint('<trkpt lat=" " lon="0"/>'), 'hay un punto con latitud o longitud no válida'],
  ])('rejects %s', (_label, xml, reason) => {
    const parse = () => parseGpx(xml);
    expect(parse).toThrow(InvalidGpxError);
    expect(parse).toThrow(new Error(`GPX no válido: ${reason}`));
  });
});
