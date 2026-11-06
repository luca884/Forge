import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppLayoutComponent } from './app-layout.component';
import { ActiveSessionBarComponent } from '@features/training/ui/components/active-session-bar.component';

@Component({ standalone: true, template: '' })
class BlankPage {}

/** Stands in for the real bar, which reads the database. */
@Component({ selector: 'fg-active-session-bar', standalone: true, template: '' })
class ActiveSessionBarStub {}

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;
  const nav = () => (fixture.nativeElement as HTMLElement).querySelector('fg-bottom-nav');
  const bar = () => (fixture.nativeElement as HTMLElement).querySelector('fg-active-session-bar');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        provideRouter([
          { path: 'home', component: BlankPage },
          { path: 'today', component: BlankPage, data: { hideActiveSessionBar: true } },
          {
            path: 'feature',
            children: [{ path: 'focus', component: BlankPage, data: { hideBottomNav: true } }],
          },
        ]),
      ],
    })
      .overrideComponent(AppLayoutComponent, {
        remove: { imports: [ActiveSessionBarComponent] },
        add: { imports: [ActiveSessionBarStub] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(AppLayoutComponent);
  });

  async function go(url: string): Promise<void> {
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
  }

  it('shows the bottom nav on regular pages', async () => {
    await go('/home');
    expect(nav()).not.toBeNull();
  });

  it('hides the bottom nav when the active (nested) route asks for it', async () => {
    await go('/feature/focus');
    expect(nav()).toBeNull();
  });

  it('shows it again when leaving the route that hid it', async () => {
    await go('/feature/focus');
    await go('/home');
    expect(nav()).not.toBeNull();
  });

  it('places the session-in-progress bar above the bottom nav on regular pages', async () => {
    await go('/home');
    expect(bar()).not.toBeNull();
    expect(bar()!.compareDocumentPosition(nav()!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('leaves the bar out on a route that already offers the way back (Hoy)', async () => {
    await go('/today');
    expect(bar()).toBeNull();
    expect(nav()).not.toBeNull();
  });

  it('leaves the bar out together with the nav (the session itself)', async () => {
    await go('/feature/focus');
    expect(bar()).toBeNull();
  });

  it('renders no nav before the first navigation ends, so a hiding route never flashes it', () => {
    fixture.detectChanges();
    expect(nav()).toBeNull();
  });
});
