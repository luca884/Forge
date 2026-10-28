/**
 * profile.page.spec.ts
 * TDD strict — tests for ProfilePage UI interactions.
 * Uses TestBed + overrideComponent to mock component-level providers.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfilePage } from './profile.page';
import { SetPreferredUnitUseCase } from '../../domain/use-cases/set-preferred-unit.use-case';
import { ClearTrainingHistoryUseCase } from '@core/shared/domain/use-cases/clear-training-history.use-case';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import { PwaInstallService } from '@core/pwa/pwa-install.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { AppearanceService } from '@core/appearance/appearance.service';
import { RestPreferencesService } from '@core/rest-preferences/rest-preferences.service';
import { ScreenWakeLockService } from '@core/wake-lock/screen-wake-lock.service';
import { ExportHistoryCsvUseCase } from '@features/progress/domain/use-cases/export-history-csv.use-case';
import { FileDownloadService } from '@core/files/file-download.service';
import { WritableSignal, signal } from '@angular/core';

interface ToastMock {
  success: jest.Mock;
  error: jest.Mock;
  info: jest.Mock;
}

interface Setup {
  fixture: ComponentFixture<ProfilePage>;
  clearSpy: jest.Mock;
  setUnitSpy: jest.Mock;
  toastMock: ToastMock;
  install: jest.Mock;
  requestPermission: jest.Mock;
  unit: WritableSignal<'kg' | 'lb'>;
  downloadSpy: jest.Mock;
}

function fakeWakeLockService(supported: boolean): Pick<ScreenWakeLockService, 'supported' | 'enabled' | 'setEnabled'> {
  const enabled = signal(false);
  return { supported, enabled, setEnabled: (value: boolean) => enabled.set(value) };
}

async function flush(fixture: ComponentFixture<ProfilePage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

function makeFixture(opts: {
  clearSpy?: jest.Mock;
  setUnitSpy?: jest.Mock;
  toastMock?: ToastMock;
  canInstall?: boolean;
  notifications?: { supported: boolean; permission: 'granted' | 'denied' | 'default' };
  wakeLockSupported?: boolean;
  exportSpy?: jest.Mock;
} = {}): Setup {
  const exportSpy = opts.exportSpy ?? jest.fn().mockResolvedValue({ content: '', rowCount: 0 });
  const downloadSpy = jest.fn();
  const clearSpy = opts.clearSpy ?? jest.fn().mockResolvedValue(undefined);
  const setUnitSpy = opts.setUnitSpy ?? jest.fn().mockResolvedValue(undefined);
  const toastMock = opts.toastMock ?? { success: jest.fn(), error: jest.fn(), info: jest.fn() };
  const install = jest.fn().mockResolvedValue(undefined);
  const requestPermission = jest.fn().mockResolvedValue(undefined);
  const unit = signal<'kg' | 'lb'>('kg');
  const notifications = opts.notifications ?? { supported: false, permission: 'default' };

  void TestBed.configureTestingModule({
    imports: [ProfilePage],
    providers: [
      { provide: ToastService, useValue: toastMock },
      {
        provide: PwaInstallService,
        useValue: { canInstall: signal(opts.canInstall ?? false), install },
      },
      {
        provide: NotificationPermissionService,
        useValue: {
          supported: signal(notifications.supported),
          permission: signal(notifications.permission),
          request: requestPermission,
        },
      },
      { provide: UserPreferencesService, useValue: { unit, loadOnce: jest.fn().mockResolvedValue(undefined) } },
      { provide: SetPreferredUnitUseCase, useValue: { execute: setUnitSpy } },
      { provide: ScreenWakeLockService, useValue: fakeWakeLockService(opts.wakeLockSupported ?? true) },
      { provide: ExportHistoryCsvUseCase, useValue: { execute: exportSpy } },
      { provide: FileDownloadService, useValue: { downloadCsv: downloadSpy } },
    ],
  })
    .overrideComponent(ProfilePage, {
      set: {
        providers: [{ provide: ClearTrainingHistoryUseCase, useValue: { execute: clearSpy } }],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ProfilePage);
  return { fixture, clearSpy, setUnitSpy, toastMock, install, requestPermission, unit, downloadSpy };
}

function root(fixture: ComponentFixture<ProfilePage>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function buttonByText(fixture: ComponentFixture<ProfilePage>, text: string): HTMLButtonElement | undefined {
  return Array.from(root(fixture).querySelectorAll('button')).find((b) => b.textContent?.trim().includes(text));
}

function radios(fixture: ComponentFixture<ProfilePage>, group: string): HTMLButtonElement[] {
  const radiogroup = root(fixture).querySelector(`[role="radiogroup"][aria-label="${group}"]`);
  return Array.from(radiogroup?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
}

function radio(fixture: ComponentFixture<ProfilePage>, group: string, name: string): HTMLButtonElement {
  const found = radios(fixture, group).find((r) => (r.getAttribute('aria-label') ?? r.textContent?.trim()) === name);
  if (!found) throw new Error(`No radio "${name}" in "${group}"`);
  return found;
}

function switchNamed(fixture: ComponentFixture<ProfilePage>, name: string): HTMLButtonElement {
  const found = root(fixture).querySelector<HTMLButtonElement>(`[role="switch"][aria-label="${name}"]`);
  if (!found) throw new Error(`No switch "${name}"`);
  return found;
}

describe('ProfilePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('layout del tablero C', () => {
    it('muestra el título y las secciones Apariencia, Entrenamiento y Datos', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const headings = Array.from(root(fixture).querySelectorAll('h1, h2')).map((h) => h.textContent?.trim());
      expect(headings).toEqual(['Perfil', 'Apariencia', 'Entrenamiento', 'Datos']);
      expect(root(fixture).textContent).toContain('Tus datos se guardan solo en este dispositivo.');
    });

    it('ya no edita nombre ni avatar', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      expect(root(fixture).querySelector('input')).toBeNull();
      expect(buttonByText(fixture, 'Guardar')).toBeUndefined();
      expect(root(fixture).textContent).not.toContain('Configurá tu perfil');
    });
  });

  describe('Apariencia — Tema (S2)', () => {
    it('ofrece Claro, Oscuro y Sistema, con Sistema marcado por defecto', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const options = radios(fixture, 'Tema');
      expect(options.map((r) => r.textContent?.trim())).toEqual(['Claro', 'Oscuro', 'Sistema']);
      expect(options.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);
    });

    it('elegir Oscuro cambia el tema al instante y lo marca', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      radio(fixture, 'Tema', 'Oscuro').click();
      fixture.detectChanges();

      expect(TestBed.inject(AppearanceService).theme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(radio(fixture, 'Tema', 'Oscuro').getAttribute('aria-checked')).toBe('true');
      expect(radio(fixture, 'Tema', 'Sistema').getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('Apariencia — Color de acento (S6)', () => {
    it('ofrece las 4 opciones con Cobalto marcado por defecto', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const options = radios(fixture, 'Color de acento');
      expect(options.map((r) => r.getAttribute('aria-label'))).toEqual(['Cobalto', 'Naranja', 'Verde', 'Tinta']);
      expect(options.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false']);
    });

    it('elegir Verde cambia el acento al instante y lo marca', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      radio(fixture, 'Color de acento', 'Verde').click();
      fixture.detectChanges();

      expect(TestBed.inject(AppearanceService).accent()).toBe('green');
      expect(document.documentElement.getAttribute('data-accent')).toBe('green');
      expect(radio(fixture, 'Color de acento', 'Verde').getAttribute('aria-checked')).toBe('true');
      expect(radio(fixture, 'Color de acento', 'Cobalto').getAttribute('aria-checked')).toBe('false');
    });
  });

  describe('Entrenamiento — Unidad de peso', () => {
    it('marca la unidad preferida actual', async () => {
      const { fixture, unit } = makeFixture();
      unit.set('lb');
      await flush(fixture);

      expect(radios(fixture, 'Unidad de peso').map((r) => [r.textContent?.trim(), r.getAttribute('aria-checked')])).toEqual([
        ['kg', 'false'],
        ['lb', 'true'],
      ]);
    });

    it('elegir lb la guarda al instante y la aplica en toda la app', async () => {
      const { fixture, setUnitSpy, unit } = makeFixture();
      await flush(fixture);

      radio(fixture, 'Unidad de peso', 'lb').click();
      await flush(fixture);

      expect(setUnitSpy).toHaveBeenCalledWith('lb');
      expect(unit()).toBe('lb');
      expect(radio(fixture, 'Unidad de peso', 'lb').getAttribute('aria-checked')).toBe('true');
    });

    it('si falla el guardado, avisa y deja la unidad anterior', async () => {
      const setUnitSpy = jest.fn().mockRejectedValue(new Error('fallo DB'));
      const { fixture, toastMock, unit } = makeFixture({ setUnitSpy });
      await flush(fixture);

      // Called directly, like the other rejection tests: a rejected jest mock behind
      // a DOM click surfaces as an uncaught error under zone.js before the catch runs.
      await fixture.componentInstance.onUnitChange('lb');
      fixture.detectChanges();

      expect(toastMock.error).toHaveBeenCalledWith('fallo DB');
      expect(unit()).toBe('kg');
      expect(radio(fixture, 'Unidad de peso', 'kg').getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('Entrenamiento — Descanso por defecto (D3)', () => {
    it('muestra el descanso guardado en m:ss, 1:30 por defecto', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const row = buttonByText(fixture, 'Descanso por defecto')!;
      expect(row.textContent).toContain('1:30');
      expect(row.getAttribute('aria-expanded')).toBe('false');
    });

    it('al abrirlo, +15 s y −15 s cambian y guardan el descanso por defecto', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      buttonByText(fixture, 'Descanso por defecto')!.click();
      fixture.detectChanges();
      expect(buttonByText(fixture, 'Descanso por defecto')!.getAttribute('aria-expanded')).toBe('true');

      root(fixture).querySelector<HTMLButtonElement>('[aria-label="Sumar 15 segundos"]')!.click();
      root(fixture).querySelector<HTMLButtonElement>('[aria-label="Sumar 15 segundos"]')!.click();
      root(fixture).querySelector<HTMLButtonElement>('[aria-label="Restar 15 segundos"]')!.click();
      fixture.detectChanges();

      expect(TestBed.inject(RestPreferencesService).defaultSeconds()).toBe(105);
      expect(buttonByText(fixture, 'Descanso por defecto')!.textContent).toContain('1:45');
    });

    it('no baja de 0:00', async () => {
      const { fixture } = makeFixture();
      TestBed.inject(RestPreferencesService).setDefaultSeconds(10);
      await flush(fixture);

      buttonByText(fixture, 'Descanso por defecto')!.click();
      fixture.detectChanges();
      const minus = root(fixture).querySelector<HTMLButtonElement>('[aria-label="Restar 15 segundos"]')!;
      minus.click();
      fixture.detectChanges();

      expect(TestBed.inject(RestPreferencesService).defaultSeconds()).toBe(0);
      expect(minus.disabled).toBe(true);
    });
  });

  describe('Entrenamiento — Pantalla siempre encendida (S4, S9)', () => {
    it('muestra la fila "Durante la sesión" apagada por defecto', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const toggle = switchNamed(fixture, 'Pantalla siempre encendida');
      expect(toggle.getAttribute('aria-checked')).toBe('false');
      expect(toggle.disabled).toBe(false);
      expect(root(fixture).textContent).toContain('Durante la sesión');
    });

    it('al tocarla se activa', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      switchNamed(fixture, 'Pantalla siempre encendida').click();
      fixture.detectChanges();

      expect(TestBed.inject(ScreenWakeLockService).enabled()).toBe(true);
      expect(switchNamed(fixture, 'Pantalla siempre encendida').getAttribute('aria-checked')).toBe('true');
    });

    it('sin soporte del navegador, se ve deshabilitada con una explicación', async () => {
      const { fixture } = makeFixture({ wakeLockSupported: false });
      await flush(fixture);

      const toggle = switchNamed(fixture, 'Pantalla siempre encendida');
      expect(toggle.disabled).toBe(true);
      expect(root(fixture).textContent).toContain('Tu navegador no permite mantener la pantalla encendida.');

      toggle.click();
      expect(TestBed.inject(ScreenWakeLockService).enabled()).toBe(false);
    });
  });

  describe('Entrenamiento — Aviso al terminar el descanso (D3)', () => {
    it('viene activado y al tocarlo se desactiva y se guarda', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const toggle = switchNamed(fixture, 'Aviso al terminar el descanso');
      expect(toggle.getAttribute('aria-checked')).toBe('true');

      toggle.click();
      fixture.detectChanges();

      expect(TestBed.inject(RestPreferencesService).alertOnEnd()).toBe(false);
      expect(switchNamed(fixture, 'Aviso al terminar el descanso').getAttribute('aria-checked')).toBe('false');
    });

    it('con permiso pendiente, ofrece "Permitir notificaciones" y lo pide', async () => {
      const { fixture, requestPermission } = makeFixture({ notifications: { supported: true, permission: 'default' } });
      await flush(fixture);

      buttonByText(fixture, 'Permitir notificaciones')!.click();

      expect(requestPermission).toHaveBeenCalledTimes(1);
    });

    it('con permiso concedido, no ofrece pedirlo', async () => {
      const { fixture } = makeFixture({ notifications: { supported: true, permission: 'granted' } });
      await flush(fixture);

      expect(buttonByText(fixture, 'Permitir notificaciones')).toBeUndefined();
    });

    it('con permiso denegado, explica que solo suena', async () => {
      const { fixture } = makeFixture({ notifications: { supported: true, permission: 'denied' } });
      await flush(fixture);

      expect(buttonByText(fixture, 'Permitir notificaciones')).toBeUndefined();
      expect(root(fixture).textContent).toContain('Notificaciones bloqueadas en el navegador');
    });

    it('sin soporte, mantiene el aviso de que hay que instalar la app', async () => {
      const { fixture } = makeFixture({ notifications: { supported: false, permission: 'default' } });
      await flush(fixture);

      expect(root(fixture).textContent).toContain('Las notificaciones requieren instalar la app primero.');
    });

    it('con el aviso apagado, no ofrece pedir el permiso', async () => {
      const { fixture } = makeFixture({ notifications: { supported: true, permission: 'default' } });
      TestBed.inject(RestPreferencesService).setAlertOnEnd(false);
      await flush(fixture);

      expect(buttonByText(fixture, 'Permitir notificaciones')).toBeUndefined();
    });
  });

  describe('Datos — Exportar historial (CSV) (S5)', () => {
    it('descarga el CSV en la unidad preferida, con la fecha local en el nombre', async () => {
      const exportSpy = jest.fn().mockResolvedValue({ content: 'fecha,rutina\r\n2026-03-02,Torso\r\n', rowCount: 1 });
      const { fixture, unit, downloadSpy } = makeFixture({ exportSpy });
      unit.set('lb');
      await flush(fixture);

      buttonByText(fixture, 'Exportar historial (CSV)')!.click();
      await flush(fixture);

      const today = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const expectedName = `forge-historial-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.csv`;
      expect(exportSpy).toHaveBeenCalledWith('lb');
      expect(downloadSpy).toHaveBeenCalledWith(expectedName, 'fecha,rutina\r\n2026-03-02,Torso\r\n');
    });

    it('sin series registradas, avisa y no descarga nada', async () => {
      const exportSpy = jest.fn().mockResolvedValue({ content: 'fecha\r\n', rowCount: 0 });
      const { fixture, toastMock, downloadSpy } = makeFixture({ exportSpy });
      await flush(fixture);

      await fixture.componentInstance.onExportHistory();

      expect(toastMock.info).toHaveBeenCalledWith('Todavía no hay series para exportar.');
      expect(downloadSpy).not.toHaveBeenCalled();
    });

    it('si falla la lectura, avisa con un toast de error', async () => {
      const exportSpy = jest.fn().mockRejectedValue(new Error('fallo DB'));
      const { fixture, toastMock, downloadSpy } = makeFixture({ exportSpy });
      await flush(fixture);

      // Called directly: see the rejection note in "Unidad de peso".
      await fixture.componentInstance.onExportHistory();

      expect(toastMock.error).toHaveBeenCalledWith('No se pudo exportar el historial', 'fallo DB');
      expect(downloadSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.exporting()).toBe(false);
    });

    it('mientras exporta, el botón queda deshabilitado', async () => {
      let finish: (value: { content: string; rowCount: number }) => void = () => undefined;
      const exportSpy = jest.fn(() => new Promise((resolve) => (finish = resolve)));
      const { fixture } = makeFixture({ exportSpy });
      await flush(fixture);

      buttonByText(fixture, 'Exportar historial (CSV)')!.click();
      fixture.detectChanges();
      expect(buttonByText(fixture, 'Exportar historial (CSV)')!.disabled).toBe(true);

      finish({ content: '', rowCount: 0 });
      await flush(fixture);
      expect(buttonByText(fixture, 'Exportar historial (CSV)')!.disabled).toBe(false);
    });
  });

  describe('Datos — instalar', () => {
    it('muestra "Instalar Forge en el inicio" solo si se puede instalar, y lo instala', async () => {
      const { fixture, install } = makeFixture({ canInstall: true });
      await flush(fixture);

      buttonByText(fixture, 'Instalar Forge en el inicio')!.click();

      expect(install).toHaveBeenCalledTimes(1);
    });

    it('lo oculta si no se puede instalar', async () => {
      const { fixture } = makeFixture({ canInstall: false });
      await flush(fixture);

      expect(buttonByText(fixture, 'Instalar Forge en el inicio')).toBeUndefined();
    });
  });

  describe('Datos — borrar historial (sin cambio de comportamiento)', () => {
    it('muestra el botón "Borrar historial" en estado normal', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      expect(buttonByText(fixture, 'Borrar historial')).toBeTruthy();
    });

    it('confirmingClear comienza en false', () => {
      const { fixture } = makeFixture();
      fixture.detectChanges();
      expect(fixture.componentInstance.confirmingClear()).toBe(false);
    });

    it('clearing comienza en false', () => {
      const { fixture } = makeFixture();
      fixture.detectChanges();
      expect(fixture.componentInstance.clearing()).toBe(false);
    });

    it('click en "Borrar historial" activa confirmingClear', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      buttonByText(fixture, 'Borrar historial')!.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.confirmingClear()).toBe(true);
    });

    it('en estado confirmando, muestra texto de advertencia', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);
      fixture.detectChanges();

      expect(root(fixture).textContent).toContain('¿Borrar todo el historial de entrenamiento? No se puede deshacer.');
    });

    it('click en "Cancelar" resetea confirmingClear a false', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);
      fixture.detectChanges();

      const cancelBtn = buttonByText(fixture, 'Cancelar');
      expect(cancelBtn).toBeTruthy();
      cancelBtn!.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.confirmingClear()).toBe(false);
    });

    it('llama al use case y muestra toast.success', async () => {
      const { fixture, clearSpy, toastMock } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);
      fixture.detectChanges();

      await fixture.componentInstance.onClearHistory();
      fixture.detectChanges();

      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(toastMock.success).toHaveBeenCalledWith('Historial borrado');
    });

    it('después de ejecutar con éxito, confirmingClear vuelve a false', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);

      await fixture.componentInstance.onClearHistory();
      fixture.detectChanges();

      expect(fixture.componentInstance.confirmingClear()).toBe(false);
    });

    it('en caso de error, muestra toast.error y NO resetea confirmingClear', async () => {
      const errorSpy = jest.fn().mockRejectedValue(new Error('fallo DB'));
      const toastMock = { success: jest.fn(), error: jest.fn(), info: jest.fn() };
      const { fixture } = makeFixture({ clearSpy: errorSpy, toastMock });
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);

      await fixture.componentInstance.onClearHistory();
      fixture.detectChanges();

      expect(toastMock.error).toHaveBeenCalled();
      expect(toastMock.success).not.toHaveBeenCalled();
      expect(fixture.componentInstance.confirmingClear()).toBe(true);
    });

    it('clearing es false después de ejecutar (finally)', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      await fixture.componentInstance.onClearHistory();

      expect(fixture.componentInstance.clearing()).toBe(false);
    });
  });
});
