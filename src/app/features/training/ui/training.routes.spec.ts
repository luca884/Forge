// The worker factory uses `import.meta`, which Jest cannot parse; routes only need it to load.
jest.mock('./services/rest-timer-worker.factory', () => ({ createRestTimerWorker: jest.fn() }));

import type { Route } from '@angular/router';
import routes from './training.routes';

describe('training routes', () => {
  const child = (path: string): Route | undefined => routes[0].children?.find((r) => r.path === path);

  it('the session runs in focus mode, without the bottom nav', () => {
    expect(child('session')?.data?.['hideBottomNav']).toBe(true);
  });

  it('home and summary keep the bottom nav', () => {
    expect(child('')?.data?.['hideBottomNav']).toBeUndefined();
    expect(child('session/summary')?.data?.['hideBottomNav']).toBeUndefined();
  });
});
