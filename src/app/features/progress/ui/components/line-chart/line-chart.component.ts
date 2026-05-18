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
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  input,
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
      <div class="empty-state">Sin datos para mostrar</div>
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
    .empty-state {
      text-align: center;
      color: #888;
      padding: 2rem;
      font-size: 0.9rem;
    }
  `,
})
export class LineChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly series = input.required<readonly LineChartSeries[]>();
  readonly xAxisLabel = input<string>('Fecha');
  readonly yAxisLabel = input<string>('');
  /**
   * When 'accent', applies a vertical CanvasGradient fill under the first dataset
   * using the resolved --accent-rgb CSS variable. Default 'none' preserves all
   * existing consumers without change. (ADR-35 — additive only, ADR-13 not violated.)
   */
  readonly gradient = input<'accent' | 'none'>('none');

  @ViewChild('chartCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;

  protected allPointsEmpty(): boolean {
    return this.series().every((s) => s.points.length === 0);
  }

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['series'] && this.chart) {
      this.updateChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private buildChartData(): ChartData<'line'> {
    const firstSeries = this.series()[0];
    if (!firstSeries || firstSeries.points.length === 0) {
      return { labels: [], datasets: [] };
    }

    return {
      labels: firstSeries.points.map((p) => this.formatDate(p.x)),
      datasets: this.series().map((s, idx) => ({
        label: s.label,
        data: s.points.map((p) => p.y),
        tension: 0.2,
        fill: false,
        borderColor: this.lineColor(idx),
        backgroundColor: this.lineColor(idx),
        pointRadius: 4,
        pointHoverRadius: 6,
      })),
    };
  }

  private buildChartOptions(): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: this.series().length > 1 },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          title: {
            display: !!this.xAxisLabel(),
            text: this.xAxisLabel(),
          },
        },
        y: {
          title: {
            display: !!this.yAxisLabel(),
            text: this.yAxisLabel(),
          },
          beginAtZero: false,
        },
      },
    };
  }

  private renderChart(): void {
    if (!this.canvasRef) return;
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: 'line',
      data: this.buildChartData(),
      options: this.buildChartOptions(),
    });

    if (this.gradient() === 'accent') {
      this.applyAccentGradient();
    }
  }

  /**
   * Applies a vertical CanvasGradient fill to the first dataset.
   * Resolves --accent-rgb from the parent element via getComputedStyle.
   * Falls back to a default warm color if the var is not resolvable (R20 fallback — jsdom/old browsers).
   * ADR-35: per-instance gradient, not a global plugin.
   * Wrapped in try-catch: Chart.js update may fail in jsdom (no real layout engine).
   */
  private applyAccentGradient(): void {
    try {
      if (!this.chart || !this.canvasRef) return;
      const canvas = this.canvasRef.nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const parentEl = canvas.parentElement ?? canvas;
      const accentRgb = getComputedStyle(parentEl)
        .getPropertyValue('--accent-rgb')
        .trim() || '255 106 31'; // R20 fallback: Brasa default

      const height = canvas.clientHeight || 300;
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, `rgba(${accentRgb}, 0.25)`);
      grad.addColorStop(1, `rgba(${accentRgb}, 0)`);

      // Chart.js dataset type omits `fill` in the union; cast to access it (ADR-35)
      type DatasetWithFill = (typeof this.chart.data.datasets)[0] & { fill?: boolean };
      const ds = this.chart.data.datasets[0] as DatasetWithFill | undefined;
      if (ds) {
        ds.backgroundColor = grad as unknown as string;
        ds.fill = true;
        this.chart.update('none');
      }
    } catch {
      // R20 fallback: gradient application fails in environments without a real layout engine
      // (e.g., jsdom in tests). Silently ignore — chart renders with flat colors instead.
    }
  }

  private updateChart(): void {
    if (!this.chart) {
      this.renderChart();
      return;
    }
    try {
      this.chart.data = this.buildChartData();
      this.chart.options = this.buildChartOptions();
      this.chart.update();
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

  private lineColor(idx: number): string {
    // Primary series resolves to the live --accent-rgb token (consistent with
    // applyAccentGradient and the rest of the design system). Secondary series
    // fall back to a fixed multi-hue palette — the design system does not
    // expose more chart-color tokens yet (R20 fallback path for jsdom).
    if (idx === 0 && this.canvasRef) {
      try {
        const parentEl = this.canvasRef.nativeElement.parentElement ?? this.canvasRef.nativeElement;
        const accentRgb = getComputedStyle(parentEl).getPropertyValue('--accent-rgb').trim();
        if (accentRgb) return `rgb(${accentRgb})`;
      } catch {
        // jsdom / no layout engine — fall through to palette
      }
    }
    const palette: string[] = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
    return palette[idx % palette.length] ?? '#4CAF50';
  }
}
