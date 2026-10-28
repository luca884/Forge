import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { FgIconComponent, type IconName } from '../icon';

export interface PageHeaderAction {
  readonly icon: IconName;
  readonly ariaLabel: string;
  readonly click: () => void;
}

@Component({
  selector: 'fg-page-header',
  standalone: true,
  imports: [FgIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="fg-page-header" role="banner">
      <div class="fg-page-header__row">
        @if (leadingIcon(); as li) {
          <button
            type="button"
            class="fg-page-header__icon-btn"
            aria-label="Volver"
            (click)="leadingClick.emit()"
          >
            <fg-icon [name]="li" [size]="18"></fg-icon>
          </button>
        } @else {
          <div class="fg-page-header__slot" aria-hidden="true"></div>
        }
        <div class="flex-1"></div>
        @if (trailingActions().length > 0) {
          <div class="fg-page-header__actions">
            @for (a of trailingActions(); track a.ariaLabel) {
              <button
                type="button"
                class="fg-page-header__icon-btn"
                [attr.aria-label]="a.ariaLabel"
                (click)="a.click()"
              >
                <fg-icon [name]="a.icon" [size]="18"></fg-icon>
              </button>
            }
          </div>
        } @else {
          <div class="fg-page-header__slot" aria-hidden="true"></div>
        }
      </div>
      <div class="fg-page-header__titles">
        <h1 class="t-h1 text-ink">{{ title() }}</h1>
        @if (subtitle(); as s) {
          <div class="t-body-sm text-ink-2 mt-0.5">{{ s }}</div>
        }
      </div>
    </header>
  `,
  styles: [
    `
    .fg-page-header {
      position: sticky;
      top: 0;
      z-index: var(--z-page-header);
      padding: 4px 20px 12px;
      background: rgb(var(--color-page) / 0.92);
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgb(var(--color-line));
    }
    .fg-page-header__row {
      display: flex;
      align-items: center;
      min-height: 44px;
    }
    .fg-page-header__slot,
    .fg-page-header__icon-btn {
      width: 44px;
      height: 44px;
    }
    /* Botón ícono del lenguaje C: 44x44, radio 10px, borde line, fondo surface. */
    .fg-page-header__icon-btn {
      border: 1px solid rgb(var(--color-line));
      border-radius: 10px;
      cursor: pointer;
      background: rgb(var(--color-surface));
      color: rgb(var(--color-ink));
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .fg-page-header__actions {
      display: flex;
      gap: 8px;
    }
    .fg-page-header__titles {
      margin-top: 6px;
    }
    `,
  ],
})
export class FgPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly leadingIcon = input<IconName | undefined>(undefined);
  readonly trailingActions = input<readonly PageHeaderAction[]>([]);
  readonly leadingClick = output<void>();
}
