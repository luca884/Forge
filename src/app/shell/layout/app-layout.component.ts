import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../navigation/bottom-nav.component';
import { FgToastOutletComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-app-layout',
  standalone: true,
  imports: [RouterOutlet, BottomNavComponent, FgToastOutletComponent],
  template: `
    <div class="app-layout">
      <main class="app-layout__content">
        <router-outlet />
      </main>
      <footer class="app-layout__footer">
        <fg-bottom-nav />
      </footer>
      <fg-toast-outlet />
    </div>
  `,
  styles: `
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      overflow: hidden;
    }

    .app-layout__content {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    .app-layout__footer {
      flex-shrink: 0;
    }
  `,
})
export class AppLayoutComponent {}
