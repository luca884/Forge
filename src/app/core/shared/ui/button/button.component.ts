import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FgIconComponent, type IconName } from '../icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent_soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

// ADR-030: module-scope literals preserve Tailwind purge (no dynamic interpolation)
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:     'bg-accent-500 text-forge-50 font-semibold',
  secondary:   'bg-forge-850 text-forge-100 ring-1 ring-inset ring-white/8 font-medium',
  ghost:       'bg-transparent text-forge-200 font-medium',
  destructive: 'bg-destructive-500/12 text-destructive-500 ring-1 ring-inset ring-destructive-500/30 font-semibold',
  accent_soft: 'bg-accent-500/12 text-accent-300 ring-1 ring-inset ring-accent-500/25 font-semibold',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-14 px-5 text-[17px]',
};

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- ADR-028: attribute selector on native <button>
  selector: 'button[fg-button]',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (leadingIcon()) { <fg-icon [name]="leadingIcon()!" [size]="iconSize()" /> }
    <ng-content />
    @if (trailingIcon()) { <fg-icon [name]="trailingIcon()!" [size]="iconSize()" /> }
  `,
  host: {
    '[class]': 'hostClasses()',
    '[disabled]': 'disabled()',
  },
})
export class FgButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly leadingIcon = input<IconName | undefined>(undefined);
  readonly trailingIcon = input<IconName | undefined>(undefined);
  readonly full = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly iconSize = computed(() => this.size() === 'lg' ? 20 : 16);

  readonly hostClasses = computed(() => [
    'inline-flex items-center justify-center gap-2 font-sans whitespace-nowrap rounded-md transition-colors',
    SIZE_CLASSES[this.size()],
    VARIANT_CLASSES[this.variant()],
    this.full() ? 'w-full' : '',
    this.disabled() ? 'opacity-45 pointer-events-none' : 'cursor-pointer',
  ].filter(Boolean).join(' '));
}
