import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'fg-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    '[class]': 'hostClasses()',
    '[style.padding.px]': 'padding()',
  },
})
export class FgCardComponent {
  readonly padding = input<number>(16);
  readonly raised = input<boolean>(true);

  readonly hostClasses = computed(() =>
    [
      // Lenguaje C: surface, borde de 1px line, radio 12px, sin sombra.
      'block bg-surface rounded-lg',
      this.raised() ? 'border border-line' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
