/**
 * SessionHeatmapComponent — fg-session-heatmap (D-26).
 * Pure presentational component. Accepts heatmapData: Map<string, number>.
 * Renders a 12-week × 7-day CSS grid (84 cells), oldest week left.
 * Tooltip on hover/tap shows date + count. No navigation (OQ-spec-3).
 * CC-26: No injected repositories or use cases.
 */
import { Component, input } from '@angular/core';

interface HeatmapCell {
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
            class="heatmap__cell {{ colorClass(cell.count) }}"
            [title]="tooltip(cell)"
            [attr.aria-label]="tooltip(cell)"
            tabindex="0"
          ></div>
        }
      </div>
      <p class="heatmap__legend">
        <span class="heatmap__cell bg-forge-800"></span> 0
        <span class="heatmap__cell bg-green-200"></span> 1
        <span class="heatmap__cell bg-green-400"></span> 2
        <span class="heatmap__cell bg-green-600"></span> 3+
      </p>
    </div>
  `,
  styles: `
    .heatmap {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.5rem 0;
    }
    .heatmap__grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: 1fr;
      gap: 3px;
    }
    .heatmap__cell {
      width: 14px;
      height: 14px;
      border-radius: 2px;
      cursor: default;
    }
    .bg-forge-800 { background-color: rgb(var(--forge-800)); }
    .bg-green-200 { background-color: #bbf7d0; }
    .bg-green-400 { background-color: #4ade80; }
    .bg-green-600 { background-color: #16a34a; }
    .heatmap__legend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }
  `,
})
export class SessionHeatmapComponent {
  readonly heatmapData = input<Map<string, number>>(new Map());

  get cells(): HeatmapCell[] {
    const result: HeatmapCell[] = [];
    const today = new Date();
    // Go back 83 days so we cover today + 83 previous days = 84 total.
    // Start from the Monday of 12 weeks ago for grid alignment.
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

  colorClass(count: number): string {
    if (count === 0) return 'bg-forge-800';
    if (count === 1) return 'bg-green-200';
    if (count === 2) return 'bg-green-400';
    return 'bg-green-600';
  }

  tooltip(cell: HeatmapCell): string {
    const sesiones = cell.count === 1 ? '1 sesión' : `${cell.count} sesiones`;
    return `${cell.label} • ${sesiones}`;
  }
}
