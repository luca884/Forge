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
      'block bg-forge-900 rounded-lg',
      this.raised() ? 'shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}
