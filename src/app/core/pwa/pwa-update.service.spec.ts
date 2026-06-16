import { TestBed } from '@angular/core/testing';
import { SwUpdate, type VersionEvent, type VersionReadyEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { ToastService } from '@core/shared/ui/toast/toast.service';
import { PwaUpdateService } from './pwa-update.service';

describe('PwaUpdateService', () => {
  let versionUpdates: Subject<VersionEvent>;
  let activateUpdate: jest.Mock;
  let service: PwaUpdateService;
  let toast: ToastService;

  function setup(isEnabled: boolean): void {
    versionUpdates = new Subject<VersionEvent>();
    activateUpdate = jest.fn().mockResolvedValue(true);
    const swUpdateStub: Pick<SwUpdate, 'isEnabled' | 'versionUpdates' | 'activateUpdate'> = {
      isEnabled,
      versionUpdates: versionUpdates.asObservable(),
      activateUpdate,
    };

    TestBed.configureTestingModule({
      providers: [PwaUpdateService, { provide: SwUpdate, useValue: swUpdateStub }],
    });
    service = TestBed.inject(PwaUpdateService);
    toast = TestBed.inject(ToastService);
  }

  const versionReady = (): VersionReadyEvent => ({
    type: 'VERSION_READY',
    currentVersion: { hash: 'old' },
    latestVersion: { hash: 'new' },
  });

  it('does not show a toast when the service worker is disabled (dev)', () => {
    setup(false);
    service.start();
    versionUpdates.next(versionReady());
    expect(toast.toasts()).toHaveLength(0);
  });

  it('shows a persistent toast with an "Actualizar" action on VERSION_READY', () => {
    setup(true);
    service.start();
    versionUpdates.next(versionReady());

    const toasts = toast.toasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].action?.label).toBe('Actualizar');
  });

  it('does not stack duplicate toasts when VERSION_READY fires twice', () => {
    setup(true);
    service.start();
    versionUpdates.next(versionReady());
    versionUpdates.next(versionReady());
    expect(toast.toasts()).toHaveLength(1);
  });

  it('ignores events other than VERSION_READY', () => {
    setup(true);
    service.start();
    versionUpdates.next({ type: 'NO_NEW_VERSION_DETECTED', version: { hash: 'x' } });
    expect(toast.toasts()).toHaveLength(0);
  });

  it('activates the pending update and reloads when the action handler runs', async () => {
    setup(true);
    const reloadSpy = jest
      .spyOn(service as unknown as { reload: () => void }, 'reload')
      .mockImplementation(() => undefined);

    service.start();
    versionUpdates.next(versionReady());
    await toast.toasts()[0].action!.handler();

    expect(activateUpdate).toHaveBeenCalledTimes(1);
    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });
});
