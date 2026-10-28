import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FgIconComponent, type IconName } from '@core/shared/ui';

interface NavTab {
  label: string;
  route: string;
  icon: IconName;
}

@Component({
  selector: 'fg-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FgIconComponent],
  template: `
    <nav class="bottom-nav" aria-label="Principal">
      @for (tab of tabs; track tab.route) {
        <a
          [routerLink]="tab.route"
          routerLinkActive="active"
          ariaCurrentWhenActive="page"
          class="bottom-nav__tab"
          [attr.aria-label]="tab.label"
        >
          <fg-icon [name]="tab.icon" [size]="22" />
          <span class="bottom-nav__label">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  // Lenguaje C "Cuaderno": superficie con borde superior line; pestaña activa en
  // accent-ink 600, inactivas en ink-2 500. Solo tokens, sin hex.
  styles: `
    .bottom-nav {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      background: rgb(var(--color-surface));
      border-top: 1px solid rgb(var(--color-line));
      padding: 6px 8px max(18px, env(safe-area-inset-bottom));
    }

    .bottom-nav__tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      min-height: 48px;
      color: rgb(var(--color-ink-2));
      font-size: 11px;
      line-height: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.2s;
    }

    .bottom-nav__tab.active {
      color: rgb(var(--color-accent-ink));
      font-weight: 600;
    }
  `,
})
export class BottomNavComponent {
  readonly tabs: NavTab[] = [
    { label: 'Hoy', route: '/training', icon: 'clock' },
    { label: 'Rutinas', route: '/routines', icon: 'list' },
    { label: 'Ejercicios', route: '/exercises', icon: 'dumbbell' },
    { label: 'Progreso', route: '/progress', icon: 'bars' },
    { label: 'Perfil', route: '/profile', icon: 'person' },
  ];
}
