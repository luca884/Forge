import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  let fixture: ComponentFixture<BottomNavComponent>;
  let component: BottomNavComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function getTabs(): DebugElement[] {
    return fixture.debugElement.queryAll(By.css('a.bottom-nav__tab'));
  }

  function getHref(tab: DebugElement): string {
    return (tab.nativeElement as HTMLAnchorElement).getAttribute('href') ?? '';
  }

  it('renderiza sin errores', () => {
    expect(component).toBeTruthy();
  });

  it('muestra exactamente 5 tabs', () => {
    expect(getTabs().length).toBe(5);
  });

  it('el primer tab apunta a /training', () => {
    expect(getHref(getTabs()[0]!)).toBe('/training');
  });

  it('el segundo tab apunta a /routines', () => {
    expect(getHref(getTabs()[1]!)).toBe('/routines');
  });

  it('el tercer tab apunta a /exercises', () => {
    expect(getHref(getTabs()[2]!)).toBe('/exercises');
  });

  it('el cuarto tab apunta a /progress', () => {
    expect(getHref(getTabs()[3]!)).toBe('/progress');
  });

  it('el quinto tab apunta a /profile', () => {
    expect(getHref(getTabs()[4]!)).toBe('/profile');
  });

  it('el quinto tab tiene la etiqueta Perfil', () => {
    const tabs = getTabs();
    const lastTab = tabs[tabs.length - 1];
    const label = lastTab?.query(By.css('.bottom-nav__label'));
    const labelEl = label?.nativeElement as HTMLElement | undefined;
    expect(labelEl?.textContent?.trim()).toBe('Perfil');
  });

  it('todos los tabs tienen aria-label', () => {
    getTabs().forEach((tab) => {
      const el = tab.nativeElement as HTMLElement;
      expect(el.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('cada tab renderiza un fg-icon del design system (no emoji)', () => {
    const tabs = getTabs();
    expect(tabs.length).toBe(5);
    tabs.forEach((tab) => {
      expect(tab.query(By.css('fg-icon'))).toBeTruthy();
    });
  });
});
