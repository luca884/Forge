import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { FgIconComponent } from '@core/shared/ui';
import { exerciseImageUrl } from '../helpers/exercise-image';

/**
 * Square thumbnail for an exercise. Renders the bundled logo-style illustration
 * (`exercises/<slug>.webp`) and falls back to a dumbbell icon when the image is
 * missing (custom exercises, or seed images not yet shipped). F-8.
 */
@Component({
  selector: 'fg-exercise-thumbnail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FgIconComponent],
  template: `
    <div
      class="h-11 w-11 shrink-0 rounded-md bg-forge-850 overflow-hidden flex items-center justify-center"
    >
      @if (failed()) {
        <fg-icon name="dumbbell" [size]="20" />
      } @else {
        <img
          [src]="src()"
          [alt]="name()"
          (error)="failed.set(true)"
          class="h-full w-full object-cover"
        />
      }
    </div>
  `,
})
export class ExerciseThumbnailComponent {
  readonly name = input.required<string>();
  readonly src = computed(() => exerciseImageUrl(this.name()));
  readonly failed = signal(false);
}
