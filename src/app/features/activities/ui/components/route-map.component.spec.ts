import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { TrackPoint } from '../../domain/activity.entity';
import { RouteMapComponent } from './route-map.component';

jest.mock('leaflet/dist/leaflet-src.esm.js', () => ({
  map: jest.fn(),
  tileLayer: jest.fn(),
  polyline: jest.fn(),
  circleMarker: jest.fn(),
}));

const leaflet = jest.requireMock('leaflet/dist/leaflet-src.esm.js');
const stylesheet = 'link[rel="stylesheet"][href="leaflet.css"]';
const point = (lat: number, lon: number): TrackPoint => ({ lat, lon, ele: null, time: null });
const points = [point(-34.6, -58.4), point(-34.61, -58.39), point(-34.62, -58.38)];
const copyrightUrl = 'https://www.openstreetmap.org/copyright';

function mockMap() {
  return { fitBounds: jest.fn(), setView: jest.fn(), remove: jest.fn() };
}

function render(track: readonly TrackPoint[] = points): ComponentFixture<RouteMapComponent> {
  const fixture = TestBed.createComponent(RouteMapComponent);
  fixture.componentRef.setInput('points', track);
  fixture.detectChanges();
  return fixture;
}

// Wait for the mocked dynamic import and its map setup, without timers or network.
async function finishLoading(): Promise<void> {
  await import('leaflet/dist/leaflet-src.esm.js');
}

describe('RouteMapComponent', () => {
  const bounds = {};
  const tile = { addTo: jest.fn() };
  const route = { addTo: jest.fn(), getBounds: jest.fn() };
  const marker = { addTo: jest.fn() };
  let map: ReturnType<typeof mockMap>;

  beforeEach(() => {
    jest.resetAllMocks();
    TestBed.configureTestingModule({ imports: [RouteMapComponent] });
    map = mockMap();
    leaflet.map.mockReturnValue(map);
    leaflet.tileLayer.mockReturnValue(tile);
    leaflet.polyline.mockReturnValue(route);
    leaflet.circleMarker.mockReturnValue(marker);
    route.addTo.mockReturnValue(route);
    route.getBounds.mockReturnValue(bounds);
  });

  afterEach(() => {
    document.head.querySelectorAll(stylesheet).forEach((link) => link.remove());
    document.documentElement.style.removeProperty('--color-accent');
  });

  it('creates the map in the labeled container with OSM tiles and visible linked attribution', async () => {
    const fixture = render();
    const root = fixture.nativeElement as HTMLElement;
    const container = root.querySelector('[role="img"][aria-label="Mapa del recorrido"]');
    expect(container).not.toBeNull();
    expect(leaflet.map).not.toHaveBeenCalled();
    await finishLoading();

    expect(leaflet.map).toHaveBeenCalledTimes(1);
    expect(leaflet.map.mock.calls[0][0]).toBe(container);
    expect(leaflet.tileLayer).toHaveBeenCalledWith('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: `<a href="${copyrightUrl}">© OpenStreetMap contributors</a>`,
    });
    expect(tile.addTo).toHaveBeenCalledWith(map);
    expect(root.querySelector(`a[href="${copyrightUrl}"]`)?.textContent).toBe('© OpenStreetMap contributors');
  });

  it('draws all coordinates and only the two endpoint markers in the accent color, then fits the route', async () => {
    document.documentElement.style.setProperty('--color-accent', '15 157 118');
    render();
    await finishLoading();

    const color = 'rgb(15 157 118)';
    expect(leaflet.polyline).toHaveBeenCalledTimes(1);
    expect(leaflet.polyline).toHaveBeenCalledWith([
      [-34.6, -58.4], [-34.61, -58.39], [-34.62, -58.38],
    ], expect.objectContaining({ color }));
    expect(route.addTo).toHaveBeenCalledWith(map);
    expect(leaflet.circleMarker).toHaveBeenCalledTimes(2);
    expect(leaflet.circleMarker).toHaveBeenNthCalledWith(1, [-34.6, -58.4], expect.objectContaining({ color }));
    expect(leaflet.circleMarker).toHaveBeenNthCalledWith(2, [-34.62, -58.38], expect.objectContaining({ color }));
    expect(marker.addTo.mock.calls).toEqual([[map], [map]]);
    expect(map.fitBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] });
    expect(map.setView).not.toHaveBeenCalled();
  });

  it('centers a zero-extent route at zoom 16 without fitting bounds', async () => {
    render([point(10, 20), point(10, 20)]);
    await finishLoading();

    expect(map.setView).toHaveBeenCalledWith([10, 20], 16);
    expect(map.fitBounds).not.toHaveBeenCalled();
  });

  it('does not load the stylesheet or create a map if destroyed before the import resolves', async () => {
    const fixture = render();
    expect(leaflet.map).not.toHaveBeenCalled();
    fixture.destroy();
    await finishLoading();

    expect(leaflet.map).not.toHaveBeenCalled();
    expect(document.head.querySelector(stylesheet)).toBeNull();
  });

  it('removes the map exactly once on destroy', async () => {
    const fixture = render();
    await finishLoading();
    expect(map.remove).not.toHaveBeenCalled();

    fixture.destroy();
    expect(map.remove).toHaveBeenCalledTimes(1);
  });

  it('adds only one stylesheet link for two maps in the same document', async () => {
    render();
    render();
    await finishLoading();

    expect(leaflet.map).toHaveBeenCalledTimes(2);
    expect(document.head.querySelectorAll(stylesheet)).toHaveLength(1);
  });

  it('removes the old map before drawing changed points and removes the replacement on destroy', async () => {
    const nextMap = mockMap();
    leaflet.map.mockReturnValueOnce(map).mockReturnValueOnce(nextMap);
    const fixture = render();
    await finishLoading();

    fixture.componentRef.setInput('points', [point(10, 20), point(11, 21), point(10, 20)]);
    fixture.detectChanges();
    await finishLoading();

    expect(leaflet.map).toHaveBeenCalledTimes(2);
    expect(map.remove).toHaveBeenCalledTimes(1);
    expect(map.remove.mock.invocationCallOrder[0]).toBeLessThan(leaflet.map.mock.invocationCallOrder[1]);
    expect(leaflet.polyline).toHaveBeenLastCalledWith([[10, 20], [11, 21], [10, 20]], expect.any(Object));
    expect(route.addTo).toHaveBeenLastCalledWith(nextMap);
    expect(nextMap.fitBounds).toHaveBeenCalledWith(bounds, { padding: [20, 20] });

    fixture.destroy();
    expect(map.remove).toHaveBeenCalledTimes(1);
    expect(nextMap.remove).toHaveBeenCalledTimes(1);
  });
});
