import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { filter, map } from 'rxjs';
import { BottomNavComponent } from '../navigation/bottom-nav.component';
import { FgToastOutletComponent } from '@core/shared/ui';

/** Deepest active route: route `data` is not inherited by lazy children, so read the leaf. */
function leaf(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? leaf(route.firstChild) : route;
}

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
      @if (hideBottomNav() === false) {
        <footer class="app-layout__footer">
          <fg-bottom-nav />
        </footer>
      }
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
export class AppLayoutComponent {
  private readonly router = inject(Router);

  /**
   * A route opts out of the bottom nav with `data: { hideBottomNav: true }`. Null until the first
   * navigation ends: the layout is created before the route is known, and showing the nav by default
   * would flash it on a reload of a route that hides it.
   */
  readonly hideBottomNav = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => leaf(this.router.routerState.snapshot.root).data['hideBottomNav'] === true),
    ),
    { initialValue: null },
  );
}
