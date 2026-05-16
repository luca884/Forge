import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavTab {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'fg-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav">
      @for (tab of tabs; track tab.route) {
        <a
          [routerLink]="tab.route"
          routerLinkActive="active"
          class="bottom-nav__tab"
          [attr.aria-label]="tab.label"
        >
          <span class="bottom-nav__icon" aria-hidden="true">{{ tab.icon }}</span>
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
      background: #1a1a1a;
      border-top: 1px solid #333;
      padding: 0.5rem 0;
    }

    .bottom-nav__tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 1rem;
      color: #888;
      text-decoration: none;
      font-size: 0.75rem;
      transition: color 0.2s;
    }

    .bottom-nav__tab.active {
      color: #e8ff8b;
    }

    .bottom-nav__icon {
      font-size: 1.25rem;
    }
  `,
})
export class BottomNavComponent {
  readonly tabs: NavTab[] = [
    { label: 'Entrenar', route: '/training', icon: '🏋️' },
    { label: 'Rutinas', route: '/routines', icon: '📋' },
    { label: 'Ejercicios', route: '/exercises', icon: '💪' },
    { label: 'Progreso', route: '/progress', icon: '📈' },
    { label: 'Perfil', route: '/profile', icon: '👤' },
  ];
}
