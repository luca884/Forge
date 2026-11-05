import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { BottomNavComponent } from '../navigation/bottom-nav.component';
import { FgToastOutletComponent } from '@core/shared/ui';

@Component({
  selector: 'fg-app-layout',
  standalone: true,
  imports: [RouterOutlet, CdkScrollable, BottomNavComponent, FgToastOutletComponent],
  template: `
    <div class="app-layout">
      <!-- cdkScrollable: pages scroll here, not in the window, so drag-and-drop lists auto-scroll it. -->
      <main class="app-layout__content" cdkScrollable>
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
      background: rgb(var(--color-page));
      color: rgb(var(--color-ink));
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
