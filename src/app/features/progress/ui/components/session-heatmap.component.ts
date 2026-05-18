/**
 * SessionHeatmapComponent — fg-session-heatmap (D-5).
 * Pure presentational component. Accepts heatmapData: Map<string, number>.
 * Renders a 12-week × 7-day CSS grid (84 cells), oldest week left.
 * Tooltip on hover/tap shows date + count. No navigation (OQ-spec-3).
 * CC-26: No injected repositories or use cases.
 *
 * R15: Uses rgba(var(--accent-rgb), alpha) for count>0 cells (no bg-green-*).
 *      count=0 cells use ring-zero class (bg-forge-850 + inset ring).
 */
import { Component, computed, input } from '@angular/core';

export interface HeatmapCell {
  date: string;    // YYYY-MM-DD
  count: number;
  label: string;   // locale display string for tooltip
}

@Component({
  selector: 'fg-session-heatmap',
  standalone: true,
  template: `
    <div class="heatmap" role="img" aria-label="Mapa de calor de sesiones (últimas 12 semanas)">
      <div class="heatmap__grid">
        @for (cell of cells; track cell.date) {
          <div
            class="heatmap__cell"
            [class.ring-zero]="cell.count === 0"
            [style.background]="cellBg(cell.count)"
            [title]="tooltip(cell)"
            [attr.aria-label]="tooltip(cell)"
            tabindex="0"
          ></div>
        }
      </div>
      <div class="heatmap__footer">
        <span class="t-caption text-forge-500">hace 12 semanas</span>
        <div class="heatmap__legend">
          <span class="t-caption text-forge-500">menos</span>
          @for (a of legendAlphas; track a) {
            <div class="heatmap__legend-swatch" [style.background]="legendBg(a)"></div>
          }
          <span class="t-caption text-forge-500">más</span>
        </div>
        <span class="t-caption text-forge-500">hoy</span>
      </div>
    </div>
  `,
  styles: `
    .heatmap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 0;
    }
    .heatmap__grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: 1fr;
      gap: 3px;
    }
    .heatmap__cell {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      cursor: default;
    }
    .heatmap__cell.ring-zero {
      background: rgb(var(--forge-850));
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    }
    .heatmap__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .heatmap__legend {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .heatmap__legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  `,
})
export class SessionHeatmapComponent {
  readonly heatmapData = input<Map<string, number>>(new Map());

  readonly legendAlphas = [0.15, 0.4, 0.65, 1] as const;

  private readonly maxCount = computed<number>(() => {
    let max = 1;
    for (const v of this.heatmapData().values()) {
      if (v > max) max = v;
    }
    return max;
  });

  get cells(): HeatmapCell[] {
    const result: HeatmapCell[] = [];
    const today = new Date();
    // Go back 83 days so we cover today + 83 previous days = 84 total.
    const start = new Date(today);
    start.setDate(today.getDate() - 83);

    for (let i = 0; i < 84; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toLocaleDateString('en-CA');
      const count = this.heatmapData().get(key) ?? 0;
      result.push({
        date: key,
        count,
        label: d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
    }
    return result;
  }

  /**
   * Returns the inline background style for a cell.
   * count=0 → undefined (CSS .ring-zero class handles styling).
   * count>0 → rgba(var(--accent-rgb), alpha) with alpha = 0.18 + (intensity * 0.82).
   */
  cellBg(count: number): string | undefined {
    if (count === 0) return undefined;
    const intensity = count / this.maxCount();
    const alpha = 0.18 + intensity * 0.82;
    return `rgba(var(--accent-rgb), ${alpha.toFixed(2)})`;
  }

  legendBg(alpha: number): string {
    return `rgba(var(--accent-rgb), ${alpha})`;
  }

  tooltip(cell: HeatmapCell): string {
    const sesiones = cell.count === 1 ? '1 sesión' : `${cell.count} sesiones`;
    return `${cell.label} • ${sesiones}`;
  }
}
