import { TestBed } from '@angular/core/testing';

import { APPEARANCE_STORAGE_KEY } from '@core/appearance/appearance.service';
import { ScreenWakeLockService } from './screen-wake-lock.service';

class FakeSentinel extends EventTarget {
  readonly type = 'screen';
  released = false;
  readonly release = jest.fn(() => {
    this.released = true;
    this.dispatchEvent(new Event('release'));
    return Promise.resolve();
  });
}

interface FakeWakeLock {
  request: jest.Mock<Promise<FakeSentinel>, [string]>;
  sentinels: FakeSentinel[];
  /** Makes the next request stay pending until the returned function is called. */
  deferNext(): () => void;
  /** Makes the next request reject, like a NotAllowedError on a hidden page. */
  rejectNext(): void;
}

function installWakeLock(): FakeWakeLock {
  const sentinels: FakeSentinel[] = [];
  let next: (() => Promise<FakeSentinel>) | null = null;
  const grant = (): Promise<FakeSentinel> => {
    const sentinel = new FakeSentinel();
    sentinels.push(sentinel);
    return Promise.resolve(sentinel);
  };
  const request = jest.fn((_type: string) => {
    const impl = next ?? grant;
    next = null;
    return impl();
  });
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  return {
    request,
    sentinels,
    deferNext() {
      let resolve: () => void = () => undefined;
      next = () =>
        new Promise<FakeSentinel>((done) => {
          resolve = () => void grant().then(done);
        });
      return () => resolve();
    },
    rejectNext() {
      next = () => Promise.reject(new DOMException('Page not visible', 'NotAllowedError'));
    },
  };
}

function setVisibility(state: DocumentVisibilityState): void {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

function stored(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

function createService(): ScreenWakeLockService {
  TestBed.configureTestingModule({});
  return TestBed.inject(ScreenWakeLockService);
}

describe('ScreenWakeLockService', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    delete (navigator as { wakeLock?: unknown }).wakeLock;
    localStorage.clear();
  });

  describe('preference (S9: off by default)', () => {
    it('is off when nothing is stored', () => {
      installWakeLock();
      expect(createService().enabled()).toBe(false);
    });

    it('reads keepAwake from forge.appearance', () => {
      installWakeLock();
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: 'dark', keepAwake: true }));

      expect(createService().enabled()).toBe(true);
    });

    it.each(['yes', 1, null])('treats a stored keepAwake of %p as off', (value) => {
      installWakeLock();
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ keepAwake: value }));

      expect(createService().enabled()).toBe(false);
    });

    it('setEnabled persists keepAwake without dropping the theme and accent', () => {
      installWakeLock();
      localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify({ theme: 'dark', accent: 'green' }));
      const service = createService();

      service.setEnabled(true);

      expect(service.enabled()).toBe(true);
      expect(stored()).toEqual({ theme: 'dark', accent: 'green', keepAwake: true });
    });
  });

  describe('during a session (S4)', () => {
    it('does not request the lock while the option is off', async () => {
      const wakeLock = installWakeLock();
      const service = createService();

      service.hold();
      await settle();

      expect(wakeLock.request).not.toHaveBeenCalled();
    });

    it('requests a screen lock when held with the option on', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);

      service.hold();
      await settle();

      expect(wakeLock.request).toHaveBeenCalledTimes(1);
      expect(wakeLock.request).toHaveBeenCalledWith('screen');
    });

    it('requests only once when held twice', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);

      service.hold();
      service.hold();
      await settle();
      service.hold();
      await settle();

      expect(wakeLock.request).toHaveBeenCalledTimes(1);
    });

    it('frees the lock when the session ends', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);
      service.hold();
      await settle();

      service.release();
      await settle();

      expect(wakeLock.sentinels[0]!.release).toHaveBeenCalledTimes(1);
    });

    it('frees a lock that arrives after the session already ended', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);
      const grant = wakeLock.deferNext();

      service.hold();
      service.release();
      grant();
      await settle();

      expect(wakeLock.sentinels).toHaveLength(1);
      expect(wakeLock.sentinels[0]!.release).toHaveBeenCalledTimes(1);
    });

    it('turning the option on mid-session requests the lock; turning it off frees it', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.hold();

      service.setEnabled(true);
      await settle();
      expect(wakeLock.request).toHaveBeenCalledTimes(1);

      service.setEnabled(false);
      await settle();
      expect(wakeLock.sentinels[0]!.release).toHaveBeenCalledTimes(1);
    });

    it('requests the lock again when the app comes back to the foreground', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);
      service.hold();
      await settle();

      // The browser frees the lock on its own when the page is hidden.
      setVisibility('hidden');
      wakeLock.sentinels[0]!.dispatchEvent(new Event('release'));
      setVisibility('visible');
      await settle();

      expect(wakeLock.request).toHaveBeenCalledTimes(2);
    });

    it('does not request on foreground when no session holds it', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);

      setVisibility('hidden');
      setVisibility('visible');
      await settle();

      expect(wakeLock.request).not.toHaveBeenCalled();
    });

    it('survives a rejected request and retries on the next foreground', async () => {
      const wakeLock = installWakeLock();
      const service = createService();
      service.setEnabled(true);
      wakeLock.rejectNext();

      service.hold();
      await settle();
      setVisibility('hidden');
      setVisibility('visible');
      await settle();

      expect(wakeLock.request).toHaveBeenCalledTimes(2);
      expect(wakeLock.sentinels).toHaveLength(1);
    });
  });

  describe('without browser support', () => {
    it('reports no support and does nothing', async () => {
      const service = createService();
      service.setEnabled(true);

      expect(service.supported).toBe(false);
      expect(() => service.hold()).not.toThrow();
      expect(() => service.release()).not.toThrow();
      await settle();
    });
  });
});
