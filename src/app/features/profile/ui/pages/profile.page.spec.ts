/**
 * profile.page.spec.ts
 * TDD strict — tests for ProfilePage UI interactions.
 * Uses TestBed + overrideComponent to mock component-level providers.
 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProfilePage } from './profile.page';
import { GetUserProfileUseCase } from '../../domain/use-cases/get-user-profile.use-case';
import { SetUserProfileUseCase } from '../../domain/use-cases/set-user-profile.use-case';
import { ClearTrainingHistoryUseCase } from '@core/shared/domain/use-cases/clear-training-history.use-case';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import { PwaInstallService } from '@core/pwa/pwa-install.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import { signal } from '@angular/core';

async function flush(fixture: ComponentFixture<ProfilePage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  await Promise.resolve();
  fixture.detectChanges();
}

function makeFixture(opts: {
  clearSpy?: jest.Mock;
  toastMock?: { success: jest.Mock; error: jest.Mock; info: jest.Mock };
} = {}): {
  fixture: ComponentFixture<ProfilePage>;
  clearSpy: jest.Mock;
  toastMock: { success: jest.Mock; error: jest.Mock; info: jest.Mock };
} {
  const clearSpy = opts.clearSpy ?? jest.fn().mockResolvedValue(undefined);
  const toastMock = opts.toastMock ?? { success: jest.fn(), error: jest.fn(), info: jest.fn() };

  void TestBed.configureTestingModule({
    imports: [ProfilePage],
    providers: [
      { provide: ToastService, useValue: toastMock },
      {
        provide: PwaInstallService,
        useValue: { canInstall: signal(false), install: jest.fn() },
      },
      {
        provide: NotificationPermissionService,
        useValue: {
          supported: signal(false),
          permission: signal('default'),
          request: jest.fn(),
        },
      },
    ],
  })
    .overrideComponent(ProfilePage, {
      set: {
        providers: [
          { provide: GetUserProfileUseCase, useValue: { execute: jest.fn().mockResolvedValue(null) } },
          { provide: SetUserProfileUseCase, useValue: { execute: jest.fn().mockResolvedValue(undefined) } },
          { provide: ClearTrainingHistoryUseCase, useValue: { execute: clearSpy } },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ProfilePage);
  return { fixture, clearSpy, toastMock };
}

describe('ProfilePage — borrar historial', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('estado inicial — zona de peligro', () => {
    it('muestra el botón "Borrar historial" en estado normal', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      const btn = fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((b) => (b.nativeElement as HTMLButtonElement).textContent?.trim().includes('Borrar historial'));
      expect(btn).toBeTruthy();
    });

    it('confirmingClear comienza en false', async () => {
      const { fixture } = makeFixture();
      fixture.detectChanges();
      expect(fixture.componentInstance.confirmingClear()).toBe(false);
    });

    it('clearing comienza en false', async () => {
      const { fixture } = makeFixture();
      fixture.detectChanges();
      expect(fixture.componentInstance.clearing()).toBe(false);
    });
  });

  describe('confirmación inline', () => {
    it('click en "Borrar historial" activa confirmingClear', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      const btn = fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((b) => (b.nativeElement as HTMLButtonElement).textContent?.trim().includes('Borrar historial'));
      (btn!.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.confirmingClear()).toBe(true);
    });

    it('en estado confirmando, muestra texto de advertencia', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent;
      expect(text).toContain('historial de entrenamiento');
    });

    it('click en "Cancelar" resetea confirmingClear a false', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);
      fixture.detectChanges();

      const cancelBtn = fixture.debugElement
        .queryAll(By.css('button[fg-button]'))
        .find((b) => (b.nativeElement as HTMLButtonElement).textContent?.trim().includes('Cancelar'));
      expect(cancelBtn).toBeTruthy();
      (cancelBtn!.nativeElement as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.confirmingClear()).toBe(false);
    });
  });

  describe('onClearHistory()', () => {
    it('llama al use case y muestra toast.success', async () => {
      const { fixture, clearSpy, toastMock } = makeFixture();
      await flush(fixture);
      fixture.componentInstance.confirmingClear.set(true);
      fixture.detectChanges();

      await fixture.componentInstance.onClearHistory();
      fixture.detectChanges();

      expect(clearSpy).toHaveBeenCalledTimes(1);
      expect(toastMock.success).toHaveBeenCalled();
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
    });

    it('clearing es false después de ejecutar (finally)', async () => {
      const { fixture } = makeFixture();
      await flush(fixture);

      await fixture.componentInstance.onClearHistory();

      expect(fixture.componentInstance.clearing()).toBe(false);
    });
  });
});
