import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isDevMode,
} from '@angular/core';
import { ICONS, type IconName } from './icon.catalog';

/**
 * FgIconComponent — renders Lucide-style inline SVG icons from the typed catalog.
 *
 * Selector: fg-icon. Standalone. Angular 19.2, signal inputs.
 * Lives in core/shared/ui/icon/ per CC-4 (scope rule).
 *
 * Usage:
 *   <fg-icon name="check" />
 *   <fg-icon name="dumbbell" [size]="24" [strokeWidth]="2" />
 *
 * Unknown name (runtime fallback):
 *   - Renders a <span data-icon-placeholder> placeholder element.
 *   - In dev mode, logs console.warn once per unknown name (module-level Set deduplicates).
 *   - Does NOT throw — graceful degradation.
 *
 * ADR-26: signal input + type literal derived from keyof typeof ICONS.
 */

/** Module-level Set to deduplicate warn calls across all instances (ADR-26, R8). */
const warnedNames = new Set<string>();

@Component({
  selector: 'fg-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (paths().length > 0) {
      <svg
        xmlns="http://www.w3.org/2000/svg"
        [attr.width]="size()"
        [attr.height]="size()"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        [attr.stroke-width]="strokeWidth()"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        @for (d of paths(); track $index) {
          <path [attr.d]="d" />
        }
      </svg>
    } @else {
      <span
        data-icon-placeholder
        [attr.title]="'missing icon: ' + name()"
        [style.display]="'inline-block'"
        [style.width.px]="size()"
        [style.height.px]="size()"
      ></span>
    }
  `,
  styles: [`:host { display: inline-flex; flex-shrink: 0; }`],
})
export class FgIconComponent {
  /**
   * Icon name from the ICONS catalog. Required.
   * Strict type — TS enforces known names at compile time.
   * The component degrades gracefully at runtime for dynamic string bindings
   * via the (ICONS as Record<string, string>) cast in computed().
   */
  readonly name = input.required<IconName>();
  /** SVG width and height in px. Default: 20. */
  readonly size = input<number>(20);
  /** SVG stroke-width. Default: 1.75. */
  readonly strokeWidth = input<number>(1.75);

  /** Computed SVG path segments split on (?=M) for multi-path icons. */
  readonly paths = computed((): string[] => {
    const n = this.name();
    const raw = (ICONS as Record<string, string>)[n];
    if (!raw) return [];
    return raw.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
  });

  constructor() {
    /**
     * Dev-mode warn effect — runs once per distinct unknown name.
     * warnedNames is module-level so the Set persists across instances
     * and across re-renders (R8 — no spam).
     */
    effect(() => {
      const n = this.name();
      if (!(n in ICONS) && isDevMode() && !warnedNames.has(n)) {
        warnedNames.add(n);
        console.warn(`[fg-icon] unknown icon: ${n}`);
      }
    });
  }
}
