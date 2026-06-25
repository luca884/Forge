import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FgIconComponent } from '@core/shared/ui';

/**
 * Square thumbnail for an exercise. Renders a generic dumbbell icon.
 * Per-exercise photos were dropped (F-8): the catalog never shipped images,
 * so every <img> 404'd and fell back to this icon anyway.
 */
@Component({
  selector: 'fg-exercise-thumbnail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FgIconComponent],
  template: `
    <div
      class="h-11 w-11 shrink-0 rounded-md bg-forge-850 flex items-center justify-center"
      [attr.aria-label]="name()"
    >
      <fg-icon name="dumbbell" [size]="20" />
    </div>
  `,
})
export class ExerciseThumbnailComponent {
  readonly name = input.required<string>();
}
