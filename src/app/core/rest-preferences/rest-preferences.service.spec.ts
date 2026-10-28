import { TestBed } from '@angular/core/testing';

import {
  DEFAULT_REST_SECONDS,
  REST_PREFERENCES_STORAGE_KEY,
  RestPreferencesService,
} from './rest-preferences.service';

function stored(): Record<string, unknown> {
  return JSON.parse(localStorage.getItem(REST_PREFERENCES_STORAGE_KEY) ?? '{}') as Record<string, unknown>;
}

function createService(): RestPreferencesService {
  TestBed.configureTestingModule({});
  return TestBed.inject(RestPreferencesService);
}

describe('RestPreferencesService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    jest.restoreAllMocks();
  });

  it('defaults to 90 seconds and the alert on when nothing is stored', () => {
    const service = createService();

    expect(DEFAULT_REST_SECONDS).toBe(90);
    expect(service.defaultSeconds()).toBe(90);
    expect(service.alertOnEnd()).toBe(true);
  });

  it('reads the stored values', () => {
    localStorage.setItem(REST_PREFERENCES_STORAGE_KEY, JSON.stringify({ defaultSeconds: 120, alertOnEnd: false }));

    const service = createService();

    expect(service.defaultSeconds()).toBe(120);
    expect(service.alertOnEnd()).toBe(false);
  });

  it.each([
    ['a negative number', { defaultSeconds: -5, alertOnEnd: 'no' }],
    ['a fraction', { defaultSeconds: 1.5, alertOnEnd: 0 }],
    ['a string', { defaultSeconds: '120', alertOnEnd: null }],
  ])('falls back to the defaults when the stored value is %s', (_label, value) => {
    localStorage.setItem(REST_PREFERENCES_STORAGE_KEY, JSON.stringify(value));

    const service = createService();

    expect(service.defaultSeconds()).toBe(90);
    expect(service.alertOnEnd()).toBe(true);
  });

  it.each(['{not json', '[1,2]', '"text"'])('falls back to the defaults when the stored JSON is %s', (raw) => {
    localStorage.setItem(REST_PREFERENCES_STORAGE_KEY, raw);

    const service = createService();

    expect(service.defaultSeconds()).toBe(90);
    expect(service.alertOnEnd()).toBe(true);
  });

  it('keeps 0 as a valid default (no rest)', () => {
    const service = createService();

    service.setDefaultSeconds(0);

    expect(service.defaultSeconds()).toBe(0);
    expect(stored()['defaultSeconds']).toBe(0);
  });

  it('setDefaultSeconds updates the value and persists it without dropping other keys', () => {
    localStorage.setItem(REST_PREFERENCES_STORAGE_KEY, JSON.stringify({ alertOnEnd: false, other: 'kept' }));
    const service = createService();

    service.setDefaultSeconds(150);

    expect(service.defaultSeconds()).toBe(150);
    expect(stored()).toEqual({ alertOnEnd: false, other: 'kept', defaultSeconds: 150 });
  });

  it.each([-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY])('setDefaultSeconds ignores %p', (seconds) => {
    const service = createService();

    service.setDefaultSeconds(seconds);

    expect(service.defaultSeconds()).toBe(90);
    expect(localStorage.getItem(REST_PREFERENCES_STORAGE_KEY)).toBeNull();
  });

  it('setAlertOnEnd updates the value and persists it', () => {
    const service = createService();

    service.setAlertOnEnd(false);

    expect(service.alertOnEnd()).toBe(false);
    expect(stored()).toEqual({ alertOnEnd: false });
  });

  it('still applies the change for this visit when localStorage cannot be written', () => {
    const service = createService();
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    service.setDefaultSeconds(60);
    service.setAlertOnEnd(false);

    expect(service.defaultSeconds()).toBe(60);
    expect(service.alertOnEnd()).toBe(false);
  });
});
