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
    <nav class="bottom-nav">
      @for (tab of tabs; track tab.route) {
        <a
          [routerLink]="tab.route"
          routerLinkActive="active"
          class="bottom-nav__tab"
          [attr.aria-label]="tab.label"
        >
          <fg-icon [name]="tab.icon" [size]="22" />
          <span class="bottom-nav__label">{{ tab.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: `
    .bottom-nav {
      display: flex;
      justify-content: space-around;
      align-items: center;
      background: rgb(var(--forge-900));
      border-top: 1px solid rgb(var(--forge-800));
      padding: 0.5rem 0;
    }

    .bottom-nav__tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      /* F-7: inactive icons were #888 on #1a1a1a — barely visible.
         Tokenized + bumped to forge-300 (text secondary) so they read clearly. */
      color: rgb(var(--forge-300));
      text-decoration: none;
      font-size: 0.75rem;
      transition: color 0.2s;
    }

    .bottom-nav__tab.active {
      color: #e8ff8b;
    }
  `,
})
export class BottomNavComponent {
  readonly tabs: NavTab[] = [
    { label: 'Entrenar', route: '/training', icon: 'dumbbell' },
    { label: 'Rutinas', route: '/routines', icon: 'calendar' },
    { label: 'Ejercicios', route: '/exercises', icon: 'weight' },
    { label: 'Progreso', route: '/progress', icon: 'trending' },
    { label: 'Perfil', route: '/profile', icon: 'user' },
  ];
}
