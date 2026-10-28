import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FgIconComponent, type IconName } from '../icon';

@Component({
  selector: 'fg-empty-state',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center px-6 py-10">
      <div
        class="w-14 h-14 rounded-xl mx-auto mb-4 bg-empty
               flex items-center justify-center text-ink-2"
      >
        <fg-icon [name]="icon()" [size]="24" />
      </div>
      <div class="t-h3 text-ink">{{ title() }}</div>
      @if (body(); as b) {
        <div class="t-body-sm text-ink-2 mt-1.5 max-w-[280px] mx-auto">{{ b }}</div>
      }
      <div class="mt-4">
        <ng-content select="[fgEmptyAction]" />
      </div>
    </div>
  `,
  host: { 'class': 'block' },
})
export class FgEmptyStateComponent {
  readonly icon = input<IconName>('dumbbell');
  readonly title = input.required<string>();
  readonly body = input<string | undefined>(undefined);
}
