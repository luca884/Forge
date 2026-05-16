import { TestBed } from '@angular/core/testing';
import { PwaInstallService } from './pwa-install.service';

/** Helper to create a fake BeforeInstallPromptEvent */
function makeBeforeInstallPromptEvent(): Event & { prompt: jest.Mock } {
  const event = new Event('beforeinstallprompt') as Event & { prompt: jest.Mock };
  event.preventDefault = jest.fn();
  event.prompt = jest.fn().mockResolvedValue(undefined);
  return event;
}

describe('PwaInstallService', () => {
  let service: PwaInstallService;
  let addEventListenerSpy: jest.SpyInstance;
  const listeners = new Map<string, EventListener>();

  beforeEach(() => {
    // Capture event listeners so we can fire them manually
    addEventListenerSpy = jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((type: string, listener: EventListenerOrEventListenerObject) => {
        listeners.set(type, listener as EventListener);
      });

    TestBed.configureTestingModule({});
    service = TestBed.inject(PwaInstallService);
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    listeners.clear();
  });

  it('should have canInstall false initially', () => {
    expect(service.canInstall()).toBe(false);
  });

  it('should set canInstall to true when beforeinstallprompt fires', () => {
    const event = makeBeforeInstallPromptEvent();
    const handler = listeners.get('beforeinstallprompt');
    expect(handler).toBeDefined();
    handler!(event);
    expect(service.canInstall()).toBe(true);
  });

  it('should call preventDefault on the beforeinstallprompt event', () => {
    const event = makeBeforeInstallPromptEvent();
    const handler = listeners.get('beforeinstallprompt');
    handler!(event);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should reset canInstall to false when appinstalled fires', () => {
    const promptEvent = makeBeforeInstallPromptEvent();
    const promptHandler = listeners.get('beforeinstallprompt');
    promptHandler!(promptEvent);
    expect(service.canInstall()).toBe(true);

    const installedHandler = listeners.get('appinstalled');
    expect(installedHandler).toBeDefined();
    installedHandler!(new Event('appinstalled'));
    expect(service.canInstall()).toBe(false);
  });

  it('should do nothing when install() is called and canInstall is false', async () => {
    // No beforeinstallprompt fired — canInstall is false
    await expect(service.install()).resolves.toBeUndefined();
  });

  it('should call prompt() and reset canInstall after install()', async () => {
    const event = makeBeforeInstallPromptEvent();
    const handler = listeners.get('beforeinstallprompt');
    handler!(event);
    expect(service.canInstall()).toBe(true);

    await service.install();

    expect(event.prompt).toHaveBeenCalled();
    expect(service.canInstall()).toBe(false);
  });

  it('should register beforeinstallprompt and appinstalled listeners on window', () => {
    expect(listeners.has('beforeinstallprompt')).toBe(true);
    expect(listeners.has('appinstalled')).toBe(true);
  });
});
