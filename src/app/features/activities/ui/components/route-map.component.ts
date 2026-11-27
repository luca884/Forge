import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ErrorHandler, afterRenderEffect, inject, input, viewChild } from '@angular/core';
import type { LatLngTuple, Map as LeafletMap } from 'leaflet';
import type { TrackPoint } from '../../domain/activity.entity';

const LEAFLET_STYLESHEET = 'leaflet.css';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const COPYRIGHT_URL = 'https://www.openstreetmap.org/copyright';
const ATTRIBUTION = '© OpenStreetMap contributors';
const DEFAULT_ACCENT = '43 89 255';

@Component({
  selector: 'fg-route-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #container role="img" aria-label="Mapa del recorrido" class="map-surface rounded-lg bg-empty"></div>
    <p class="text-right text-xs text-ink-2">
      <a [href]="copyrightUrl" target="_blank" rel="noopener" class="underline">{{ attribution }}</a>
    </p>
  `,
  styles: `
    .map-surface {
      height: 16rem;
      isolation: isolate;
    }
  `,
})
export class RouteMapComponent {
  readonly points = input.required<readonly TrackPoint[]>();

  protected readonly copyrightUrl = COPYRIGHT_URL;
  protected readonly attribution = ATTRIBUTION;

  private readonly document = inject(DOCUMENT);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly container = viewChild.required<ElementRef<HTMLDivElement>>('container');

  constructor() {
    afterRenderEffect((onCleanup) => {
      const container = this.container().nativeElement;
      const coordinates = this.points().map<LatLngTuple>(({ lat, lon }) => [lat, lon]);
      const start = coordinates[0];
      const end = coordinates.at(-1);
      if (!start || !end) return;

      let disposed = false;
      let map: LeafletMap | undefined;
      onCleanup(() => {
        disposed = true;
        map?.remove();
      });

      void import('leaflet/dist/leaflet-src.esm.js').then((leaflet) => {
        if (disposed) return;
        this.ensureStylesheet();
        const accent = this.document.defaultView?.getComputedStyle(this.document.documentElement)
          .getPropertyValue('--color-accent').trim();
        const color = `rgb(${accent || DEFAULT_ACCENT})`;

        // Keep attribution outside the element exposed to assistive technology as an image.
        map = leaflet.map(container, { attributionControl: false, zoomControl: false });
        leaflet.tileLayer(TILE_URL, {
          maxZoom: 19,
          attribution: `<a href="${COPYRIGHT_URL}">${ATTRIBUTION}</a>`,
        }).addTo(map);
        const route = leaflet.polyline(coordinates, { color }).addTo(map);
        leaflet.circleMarker(start, { color, radius: 5, fill: false }).addTo(map);
        leaflet.circleMarker(end, { color, radius: 5, fillOpacity: 1 }).addTo(map);

        if (coordinates.every(([lat, lon]) => lat === start[0] && lon === start[1])) {
          map.setView(start, 16);
        } else {
          map.fitBounds(route.getBounds(), { padding: [20, 20] });
        }
      }).catch((error: unknown) => {
        if (!disposed) this.errorHandler.handleError(error);
      });
    });
  }

  private ensureStylesheet(): void {
    if (this.document.head.querySelector(`link[rel="stylesheet"][href="${LEAFLET_STYLESHEET}"]`)) return;
    const link = this.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_STYLESHEET;
    this.document.head.append(link);
  }
}
