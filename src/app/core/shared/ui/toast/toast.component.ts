import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FgIconComponent, type IconName } from '../icon';

export type ToastKind = 'info' | 'success' | 'error';

interface ToastKindStyle {
  icon: IconName;
  iconClass: string;
  ring: string;
}

const KIND_MAP: Record<ToastKind, ToastKindStyle> = {
  info: {
    icon: 'info',
    iconClass: 'text-forge-300',
    ring: 'rgba(255,255,255,.08)',
  },
  success: {
    icon: 'check-circle',
    iconClass: 'text-accent-300',
    ring: 'rgba(var(--accent-rgb),.32)',
  },
  error: {
    icon: 'info',
    iconClass: 'text-destructive-500',
    ring: 'rgba(209,69,69,.4)',
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
      <div class="t-body font-semibold text-forge-100">{{ title() }}</div>
      @if (body()) {
        <div class="t-body-sm text-forge-300 mt-0.5">{{ body() }}</div>
      }
    </div>
    <button
      type="button"
      aria-label="Cerrar"
      class="text-forge-500 hover:text-forge-300 cursor-pointer bg-transparent border-0 p-0 flex-shrink-0"
      (click)="dismiss.emit()"
    >
      <fg-icon name="x" [size]="16" />
    </button>
  `,
  host: {
    class: 'flex gap-3 items-start max-w-[360px] bg-forge-850 rounded-lg px-3.5 py-3',
    '[style.box-shadow]': '"inset 0 0 0 1px " + kindStyle().ring + ", 0 12px 32px rgba(0,0,0,.5)"',
  },
})
export class FgToastComponent {
  readonly title = input.required<string>();
  readonly body = input<string | undefined>(undefined);
  readonly kind = input<ToastKind>('info');

  readonly dismiss = output<void>();

  readonly kindStyle = computed(() => KIND_MAP[this.kind()]);
}
