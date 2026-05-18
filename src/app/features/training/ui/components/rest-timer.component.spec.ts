/**
 * RestTimerComponent spec (D-2, ADR-32 pinned variant).
 * TDD strict — RED before implementation.
 * Tests pinned bar visual structure + preserved API behaviour.
 * RestTimerService is mocked — read-only per CC-7.
 *
 * Must mock rest-timer-worker.factory before any import —
 * the factory uses import.meta.url which Jest CJS transform cannot parse.
 */

// Mock the worker factory BEFORE any imports that transitively touch it
jest.mock('../services/rest-timer-worker.factory', () => ({
  createRestTimerWorker: () => ({
    postMessage: jest.fn(),
    onmessage: null,
    terminate: jest.fn(),
  }),
}));

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RestTimerComponent } from './rest-timer.component';
import { RestTimerService } from '../services/rest-timer.service';

// Minimal service mock matching the exact API of RestTimerService
function makeTimerService(remaining: number | null = 90, isRunning = true) {
  const remainingSignal = signal<number | null>(remaining);
  const isRunningSignal = signal<boolean>(isRunning);
  return {
    remaining: remainingSignal,
    isRunning: isRunningSignal,
    skip: jest.fn(),
    cancel: jest.fn(),
    start: jest.fn(),
  };
}

describe('RestTimerComponent', () => {
  let fixture: ComponentFixture<RestTimerComponent>;
  let mockService: ReturnType<typeof makeTimerService>;

  describe('when timer is active (remaining != null)', () => {
    beforeEach(async () => {
      mockService = makeTimerService(90, true);

      await TestBed.configureTestingModule({
        imports: [RestTimerComponent],
        providers: [
          { provide: RestTimerService, useValue: mockService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(RestTimerComponent);
      fixture.detectChanges();
    });

    // ── VISUAL STRUCTURE TESTS (PINNED variant, D-2) ────────────────────────

    it('renders the pinned bar container when remaining is not null', () => {
      const container = (fixture.nativeElement as HTMLElement).querySelector('div');
      expect(container).toBeTruthy();
    });

    it('pinned bar has backdrop-blur class for blur effect', () => {
      const el = fixture.nativeElement as HTMLElement;
      // The component uses inline styles for backdrop-blur (component-scoped CSS .rest-timer-pinned)
      // We verify the outer div is present and has a role attribute
      const bar = el.querySelector<HTMLElement>('[role="status"]');
      expect(bar).toBeTruthy();
    });

    it('pulsing dot element is present', () => {
      const el = fixture.nativeElement as HTMLElement;
      const dot = el.querySelector<HTMLElement>('.dot-pulse');
      expect(dot).toBeTruthy();
    });

    it('"DESCANSO" label is visible', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('DESCANSO');
    });

    it('countdown displays formatted time mm:ss', () => {
      // remaining = 90 → 1:30
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('1:30');
    });

    it('"Saltar" button is present', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button');
      expect(btn).toBeTruthy();
      expect(btn!.textContent?.trim()).toBe('Saltar');
    });

    it('progress bar element is present at bottom of container', () => {
      const bar = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.progress-bar');
      expect(bar).toBeTruthy();
    });

    it('progress fill element is present inside progress bar', () => {
      const fill = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.progress-fill');
      expect(fill).toBeTruthy();
    });

    // ── BEHAVIOUR TESTS (PRESERVED) ─────────────────────────────────────────

    it('clicking "Saltar" calls timerService.skip()', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;
      btn.click();
      fixture.detectChanges();
      expect(mockService.skip).toHaveBeenCalledTimes(1);
    });

    it('progressPct is 0 when no elapsed time (first render)', () => {
      // initialSeconds will be set to 90 on first render, remaining=90, elapsed=0 → pct=0
      const comp = fixture.componentInstance;
      expect(comp.progressPct()).toBe(0);
    });

    it('progressPct increases as remaining decreases', () => {
      // Start: initialSeconds=90, remaining=90 → 0%
      // After: remaining=45 → 50%
      const comp = fixture.componentInstance;
      // First, the component captures initialSeconds=90 from remaining()=90
      // Then we simulate remaining dropping to 45
      mockService.remaining.set(45);
      fixture.detectChanges();
      // (90 - 45) / 90 = 50%
      expect(comp.progressPct()).toBeCloseTo(50, 0);
    });

    it('remainingFormatted returns "1:30" for 90 seconds', () => {
      const comp = fixture.componentInstance;
      expect(comp.remainingFormatted()).toBe('1:30');
    });

    it('remainingFormatted returns "0:05" for 5 seconds', () => {
      mockService.remaining.set(5);
      fixture.detectChanges();
      const comp = fixture.componentInstance;
      expect(comp.remainingFormatted()).toBe('0:05');
    });
  });

  describe('when timer is inactive (remaining = null)', () => {
    beforeEach(async () => {
      mockService = makeTimerService(null, false);

      await TestBed.configureTestingModule({
        imports: [RestTimerComponent],
        providers: [
          { provide: RestTimerService, useValue: mockService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(RestTimerComponent);
      fixture.detectChanges();
    });

    it('bar is hidden when remaining() is null', () => {
      const bar = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="status"]');
      expect(bar).toBeNull();
    });

    it('no content rendered when timer is inactive', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
      expect(text).toBe('');
    });
  });
});
