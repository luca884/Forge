/**
 * <fg-line-chart> — chart adapter component (ADR-13, D-30, CC-18).
 *
 * IMPLEMENTATION: bare Chart.js via ElementRef<HTMLCanvasElement> + ngAfterViewInit.
 * ng2-charts was NOT used: ng2-charts@6 requires @angular/cdk@^21 which is incompatible
 * with Angular 19.2. Per D-34/R2 fallback: bare chart.js only.
 *
 * This is the ONLY file in the codebase that imports from 'chart.js' (CC-18 isolation).
 * All other components consume <fg-line-chart> inputs/outputs only.
 */
import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { AppearanceService } from '@core/appearance/appearance.service';
import { chartAlpha, readChartPalette, type ChartPalette } from '../../helpers/chart-palette';
import type { LineChartSeries } from '../../helpers/time-series';

// Register only required Chart.js components (tree-shakable)
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
);

@Component({
  selector: 'fg-line-chart',
  standalone: true,
  template: `
    @if (series().length === 0 || allPointsEmpty()) {
      <div class="empty-state text-center text-ink-2 p-8 text-[13px]">Sin datos para mostrar</div>
    } @else {
      <canvas #chartCanvas></canvas>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      width: 100%;
    }
    canvas {
      width: 100% !important;
      max-height: 300px;
    }
  `,
})
export class LineChartComponent implements AfterViewChecked, OnChanges, OnDestroy {
  readonly series = input.required<readonly LineChartSeries[]>();
  readonly xAxisLabel = input<string>('Fecha');
  readonly yAxisLabel = input<string>('');
  /**
   * When 'accent', applies a vertical CanvasGradient fill under the first dataset
   * using the resolved --color-accent token. Default 'none' preserves all
   * existing consumers without change. (ADR-35 — additive only, ADR-13 not violated.)
   */
  readonly gradient = input<'accent' | 'none'>('none');

  @ViewChild('chartCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  /** The element `chart` draws on: the @if in the template swaps the <canvas> after an empty series. */
  private chartCanvas: HTMLCanvasElement | null = null;
  private readonly appearance = inject(AppearanceService);

  constructor() {
    // The canvas cannot read CSS variables by itself: repaint with the new
    // tokens when the theme or the accent changes (data-theme / data-accent
    // are already applied by AppearanceService when this runs).
    effect(() => {
      this.appearance.resolvedTheme();
      this.appearance.accent();
      untracked(() => this.repaint());
    });
  }

  protected allPointsEmpty(): boolean {
    return this.series().every((s) => s.points.length === 0);
  }

  ngAfterViewChecked(): void {
    const canvas = this.canvasRef?.nativeElement ?? null;
    if (canvas === this.chartCanvas) return;
    // The <canvas> appeared, vanished or was replaced (an empty series removes it, and
    // the data coming back creates a new one). A chart bound to the old element draws
    // nowhere, so drop it and draw on the one that is in the page now.
    this.destroyChart();
    if (canvas) this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series']) this.repaint();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
    this.chartCanvas = null;
  }

  private buildChartData(palette: ChartPalette): ChartData<'line'> {
    const firstSeries = this.series()[0];
    if (!firstSeries || firstSeries.points.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: firstSeries.points.map((p) => this.formatDate(p.x)),
      datasets: this.series().map((s, idx) => {
        const color = this.lineColor(idx, palette);
        const lastIndex = s.points.length - 1;
        const fill = idx === 0 ? this.gradientFill(palette) : null;
        return {
          label: s.label,
          data: s.points.map((p) => p.y),
          tension: 0.2,
          // Chart.js dataset typing omits `fill` for the gradient case; it is a boolean here.
          fill: fill !== null,
          borderColor: color,
          borderWidth: 2,
          backgroundColor: fill ?? color,
          // Cuaderno: only the latest point is marked, with a ring in the card colour.
          pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === lastIndex ? 4 : 0),
          pointHoverRadius: 5,
          pointBackgroundColor: color,
          pointBorderColor: palette.surface,
          pointBorderWidth: 2,
        };
      }),
    };
  }

  private buildChartOptions(palette: ChartPalette): ChartOptions<'line'> {
    const mono = { family: "'JetBrains Mono', ui-monospace, monospace", size: 10 };
    const title = (text: string) => ({
      display: !!text,
      text,
      color: palette.ink2,
      font: mono,
    });
    return {
      responsive: true,
      maintainAspectRatio: false,
      // Only the latest point is drawn, so a tap would almost never land on a dot (Chart.js
      // default: intersect). Pick the point nearest to the tap along x, at any distance;
      // the tooltip falls back to this scope too, so touch and hover share it.
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: { display: this.series().length > 1, labels: { color: palette.ink2, font: mono } },
        tooltip: {
          enabled: true,
          backgroundColor: palette.surface,
          titleColor: palette.ink,
          bodyColor: palette.ink2,
          borderColor: palette.line,
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: title(this.xAxisLabel()),
          ticks: { color: palette.ink2, font: mono, maxRotation: 0, autoSkipPadding: 12 },
          grid: { display: false },
          // Baseline in ink, like the Cuaderno board.
          border: { color: palette.ink },
        },
        y: {
          title: title(this.yAxisLabel()),
          beginAtZero: false,
          ticks: { color: palette.ink2, font: mono, maxTicksLimit: 4 },
          // Dashed grid in the line token, no axis stroke.
          grid: { color: palette.line, tickLength: 0 },
          border: { display: false, dash: [3, 3] },
        },
      },
    };
  }

  private renderChart(): void {
    if (!this.canvasRef) return;
    this.chart?.destroy();
    const canvas = this.canvasRef.nativeElement;
    const palette = readChartPalette();
    this.chart = new Chart(canvas, {
      type: 'line',
      data: this.buildChartData(palette),
      options: this.buildChartOptions(palette),
    });
    this.chartCanvas = canvas;
  }

  /**
   * Vertical CanvasGradient under the first dataset when gradient="accent".
   * Needs a real 2d context: returns null (flat colours) in environments without
   * a layout engine such as jsdom. ADR-35: per-instance gradient, not a global plugin.
   */
  private gradientFill(palette: ChartPalette): CanvasGradient | null {
    if (this.gradient() !== 'accent' || !this.canvasRef) return null;
    try {
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.clientHeight || 300);
      grad.addColorStop(0, chartAlpha(palette.accent, 0.16));
      grad.addColorStop(1, chartAlpha(palette.accent, 0));
      return grad;
    } catch {
      return null;
    }
  }

  /**
   * Rebuilds data and options from the current series and tokens and repaints the
   * existing chart (new data, or the theme / accent changed). Nothing to repaint
   * while there is no chart: ngAfterViewChecked creates it once there is a canvas.
   */
  private repaint(): void {
    const chart = this.chart;
    if (!chart) return;
    try {
      const palette = readChartPalette();
      chart.data = this.buildChartData(palette);
      chart.options = this.buildChartOptions(palette);
      chart.update();
    } catch {
      // Guard against Chart.js layout errors in non-browser environments (e.g., jsdom)
    }
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  }

  private lineColor(idx: number, palette: ChartPalette): string {
    // The primary series is the accent. The Cuaderno system has one accent, so
    // secondary series (no consumer uses them today) step through the ink tones.
    const tones = [palette.accent, palette.ink, palette.ink2, palette.line];
    return tones[idx % tones.length] ?? palette.accent;
  }
}
