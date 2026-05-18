import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'fg-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  host: {
    'class': 'block fg-skeleton',
    '[style.width]': 'widthStyle()',
    '[style.height.px]': 'height()',
    '[style.border-radius.px]': 'radius()',
  },
  styles: [
    `
    :host.fg-skeleton {
      background: linear-gradient(
        90deg,
        rgb(var(--forge-850)) 0%,
        rgb(var(--forge-800)) 50%,
        rgb(var(--forge-850)) 100%
      );
      background-size: 200% 100%;
      animation: forge-shimmer 1.6s ease-in-out infinite;
    }
    `,
  ],
})
export class FgSkeletonComponent {
  readonly width = input<string | number>('100%');
  readonly height = input<number>(12);
  readonly radius = input<number>(6);

  readonly widthStyle = computed(() => {
    const w = this.width();
    return typeof w === 'number' ? `${w}px` : w;
  });
}
