import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FgToastComponent } from './toast.component';
import { ToastService, type Toast } from './toast.service';

@Component({
  selector: 'fg-toast-outlet',
  standalone: true,
  imports: [FgToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      @for (t of toastService.toasts(); track t.id) {
        <div class="pointer-events-auto">
          <fg-toast
            [title]="t.title"
            [body]="t.body"
            [kind]="t.kind"
            [action]="t.action"
            (actionClick)="onAction(t)"
            (dismiss)="toastService.dismiss(t.id)"
          />
        </div>
      }
    </div>
  `,
})
export class FgToastOutletComponent {
  readonly toastService = inject(ToastService);

  onAction(toast: Toast): void {
    toast.action?.handler();
    this.toastService.dismiss(toast.id);
  }
}
