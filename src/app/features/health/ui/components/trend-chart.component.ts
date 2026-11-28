import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { barGeometry, lineGeometry, type Point } from './trend-geometry';

const WIDTH = 300;
const HEIGHT = 80;

const toPoints = (points: Point[]): string => points.map(({ x, y }) => `${x},${y}`).join(' ');

/** Gráfico mínimo de una serie diaria en SVG, sin librerías: barras o línea. */
@Component({
  selector: 'fg-trend-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      role="img"
      [attr.aria-label]="label()"
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      preserveAspectRatio="none"
      class="block h-20 w-full text-accent"
    >
      <line x1="0" [attr.y1]="height" [attr.x2]="width" [attr.y2]="height" stroke="currentColor" stroke-opacity="0.25" />
      @if (kind() === 'bars') {
        @for (bar of bars(); track $index) {
          @if (bar) {
            <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" rx="1" fill="currentColor" />
          }
        }
      } @else {
        @for (segment of line().segments; track $index) {
          @if (segment.length > 1) {
            <polyline [attr.points]="points(segment)" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
          }
        }
        @for (dot of line().dots; track $index) {
          <circle [attr.cx]="dot.x" [attr.cy]="dot.y" r="2.5" fill="currentColor" />
        }
      }
    </svg>
  `,
})
export class FgTrendChartComponent {
  readonly values = input.required<readonly (number | null)[]>();
  readonly kind = input<'bars' | 'line'>('bars');
  readonly label = input.required<string>();

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  protected readonly points = toPoints;
  protected readonly bars = computed(() => barGeometry(this.values(), WIDTH, HEIGHT, this.values().length > 14 ? 1 : 4));
  protected readonly line = computed(() => lineGeometry(this.values(), WIDTH, HEIGHT, 6));
}
