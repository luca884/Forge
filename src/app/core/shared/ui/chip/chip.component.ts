import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FgIconComponent, type IconName } from '../icon';

export type ChipSize = 'sm' | 'md';

const CHIP_SIZE_CLASSES: Record<ChipSize, string> = {
  sm: 'h-6 text-[11px]',
  md: 'h-7 text-[12px]',
};

@Component({
  selector: 'fg-chip',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (leadingIcon(); as li) {
      <fg-icon [name]="li" [size]="12" />
    }
    <ng-content />
  `,
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': 'tap.observed ? "button" : null',
    '[attr.tabindex]': 'tap.observed ? 0 : null',
    '(click)': 'onTap()',
    '(keydown.enter)': 'onTap()',
    '(keydown.space)': 'onTap(); $event.preventDefault()',
  },
})
export class FgChipComponent {
  readonly active = input<boolean>(false);
  readonly size = input<ChipSize>('md');
  readonly leadingIcon = input<IconName | undefined>(undefined);
  readonly tap = output<void>();

  // Lenguaje C: píldora con borde de 1px. Inactivo = surface con borde line y texto
  // ink-2; activo = acento suave con borde y texto de acento (accent-ink cumple
  // contraste en los dos temas). Sirve igual de filtro que de etiqueta ("PR", "Activa").
  readonly hostClasses = computed(() =>
    [
      'inline-flex items-center gap-1.5 px-2.5 border rounded-full font-semibold tracking-[0.02em] select-none',
      CHIP_SIZE_CLASSES[this.size()],
      this.active()
        ? 'bg-accent-soft text-accent-ink border-accent'
        : 'bg-surface text-ink-2 border-line',
      'cursor-pointer',
    ].join(' '),
  );

  protected onTap(): void {
    this.tap.emit();
  }
}
