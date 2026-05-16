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
  }

  private updateChart(): void {
    if (!this.chart) {
      this.renderChart();
      return;
    }
    this.chart.data = this.buildChartData();
    this.chart.options = this.buildChartOptions();
    this.chart.update();
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
    });
  }

  private lineColor(idx: number): string {
    const colors: string[] = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
    return colors[idx % colors.length] ?? '#4CAF50';
  }
}
