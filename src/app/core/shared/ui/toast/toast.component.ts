import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FgIconComponent, type IconName } from '../icon';
import type { ToastAction } from './toast.service';

export type ToastKind = 'info' | 'success' | 'error';

interface ToastKindStyle {
  icon: IconName;
  iconClass: string;
  border: string;
}

const KIND_MAP: Record<ToastKind, ToastKindStyle> = {
  info: {
    icon: 'info',
    iconClass: 'text-ink-2',
    border: 'border-line',
  },
  success: {
    icon: 'check-circle',
    iconClass: 'text-accent-ink',
    border: 'border-accent/40',
  },
  error: {
    icon: 'info',
    iconClass: 'text-danger',
    border: 'border-danger/50',
  },
};

@Component({
  selector: 'fg-toast',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fg-icon
      [name]="kindStyle().icon"
      [size]="18"
      [class]="kindStyle().iconClass + ' mt-0.5'"
    />
    <div class="flex-1 min-w-0">
      <div class="t-body font-semibold text-ink">{{ title() }}</div>
      @if (body()) {
        <div class="t-body-sm text-ink-2 mt-0.5">{{ body() }}</div>
      }
    </div>
    @if (action(); as a) {
      <button
        type="button"
        data-testid="action"
        class="t-body-sm font-semibold text-accent-ink cursor-pointer bg-transparent border-0 p-0 flex-shrink-0 self-center"
        (click)="actionClick.emit()"
      >
        {{ a.label }}
      </button>
    }
    <button
      type="button"
      aria-label="Cerrar"
      class="text-ink-2 hover:text-ink cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
      (click)="dismiss.emit()"
    >
      <fg-icon name="x" [size]="16" />
    </button>
  `,
  host: {
    '[class]': 'hostClasses()',
    '[style.box-shadow]': '"0 12px 32px var(--color-shadow)"',
  },
})
export class FgToastComponent {
  readonly title = input.required<string>();
  readonly body = input<string | undefined>(undefined);
  readonly kind = input<ToastKind>('info');
  readonly action = input<ToastAction | undefined>(undefined);

  readonly dismiss = output<void>();
  readonly actionClick = output<void>();

  readonly kindStyle = computed(() => KIND_MAP[this.kind()]);

  // Lenguaje C: surface + borde de 1px (color según el tipo) + sombra del tema.
  readonly hostClasses = computed(
    () => `flex gap-3 items-start max-w-[360px] bg-surface border rounded-lg px-3.5 py-3 ${this.kindStyle().border}`,
  );
}
