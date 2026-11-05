import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppLayoutComponent } from './app-layout.component';

@Component({ standalone: true, template: '' })
class BlankPage {}

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;
  const nav = () => (fixture.nativeElement as HTMLElement).querySelector('fg-bottom-nav');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        provideRouter([
          { path: 'home', component: BlankPage },
          {
            path: 'feature',
            children: [{ path: 'focus', component: BlankPage, data: { hideBottomNav: true } }],
          },
        ]),
      ],
    }).compileComponents();
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

  it('renders no nav before the first navigation ends, so a hiding route never flashes it', () => {
    fixture.detectChanges();
    expect(nav()).toBeNull();
  });
});
