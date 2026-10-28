import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';

@Component({ standalone: true, template: '' })
class BlankPage {}

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

  it('las etiquetas son Hoy, Rutinas, Ejercicios, Progreso y Perfil (L9)', () => {
    const labels = getTabs().map((tab) =>
      (tab.query(By.css('.bottom-nav__label')).nativeElement as HTMLElement).textContent?.trim(),
    );
    expect(labels).toEqual(['Hoy', 'Rutinas', 'Ejercicios', 'Progreso', 'Perfil']);
  });

  it('cada tab usa el ícono del canvas C (Ejercicios conserva uno del catálogo)', () => {
    const names = getTabs().map(
      (tab) => (tab.query(By.css('fg-icon')).componentInstance as { name: () => string }).name(),
    );
    expect(names).toEqual(['clock', 'list', 'dumbbell', 'bars', 'person']);
  });

  it('los íconos miden 22px', () => {
    getTabs().forEach((tab) => {
      const icon = tab.query(By.css('fg-icon')).componentInstance as { size: () => number };
      expect(icon.size()).toBe(22);
    });
  });
});

describe('BottomNavComponent · pestaña activa', () => {
  let fixture: ComponentFixture<BottomNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [
        provideRouter([
          { path: 'training', component: BlankPage },
          { path: 'routines', component: BlankPage },
          { path: 'exercises', component: BlankPage },
          { path: 'progress', component: BlankPage },
          { path: 'profile', component: BlankPage },
        ]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BottomNavComponent);
    fixture.detectChanges();
  });

  it('marca solo la pestaña de la ruta actual con aria-current="page"', async () => {
    await TestBed.inject(Router).navigateByUrl('/routines');
    fixture.detectChanges();
    const tabs = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.bottom-nav__tab'),
    );
    expect(tabs.map((t) => t.getAttribute('aria-current'))).toEqual([null, 'page', null, null, null]);
    expect(tabs[1]!.classList.contains('active')).toBe(true);
  });
});
