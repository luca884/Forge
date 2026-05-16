import { Component, input } from '@angular/core';

export type BannerKind = 'info' | 'muted' | 'rest';

/**
 * BannerComponent — minimal presentational banner for informational messages.
 *
 * Selector: fg-banner. Standalone. Used by TrainingHomePage for suggested-day display.
 * Inputs: message (optional — can use ng-content instead), kind: BannerKind.
 * D-33, OQ-D3. Lives in core/shared/ui/ per design.
 */
@Component({
  selector: 'fg-banner',
  standalone: true,
  template: `
    <div
      class="fg-banner"
      [class.fg-banner--info]="kind() === 'info'"
      [class.fg-banner--muted]="kind() === 'muted' || kind() === 'rest'"
      role="status"
      aria-live="polite"
    >
      <ng-content />
    </div>
  `,
  styles: [`
    .fg-banner {
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 0.75rem;
    }
    .fg-banner--info {
      background-color: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    .fg-banner--muted {
      background-color: #f3f4f6;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }
  `],
})
export class BannerComponent {
  readonly kind = input<BannerKind>('info');
}
