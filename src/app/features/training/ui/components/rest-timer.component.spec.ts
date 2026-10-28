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

    it('renders the rest pill as role="timer" with the remaining time as accessible name', () => {
      const el = fixture.nativeElement as HTMLElement;
      const pill = el.querySelector<HTMLElement>('[role="timer"]');
      expect(pill).toBeTruthy();
      // remaining = 90 -> "1 minuto 30 segundos"
      expect(pill!.getAttribute('aria-label')).toBe('Descanso restante 1 minuto 30 segundos');
    });

    it('accessible name pluralises minutes and drops zero parts', () => {
      mockService.remaining.set(120);
      fixture.detectChanges();
      const pill = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="timer"]')!;
      expect(pill.getAttribute('aria-label')).toBe('Descanso restante 2 minutos');
      mockService.remaining.set(1);
      fixture.detectChanges();
      expect(pill.getAttribute('aria-label')).toBe('Descanso restante 1 segundo');
    });

    it('uses only semantic Cuaderno classes (no forge-*, accent-<n>, ring-white, hex)', () => {
      const html = (fixture.nativeElement as HTMLElement).innerHTML;
      expect(html).not.toMatch(/forge-\d|accent-\d|ring-white|destructive-\d|--pr-warm|#[0-9a-fA-F]{6}/);
      const pill = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="timer"]')!;
      expect(pill.classList).toContain('bg-accent-soft');
      expect(pill.classList).toContain('text-accent-ink');
    });

    it('a timer icon is present', () => {
      const icon = (fixture.nativeElement as HTMLElement).querySelector('fg-icon[name="timer"]');
      expect(icon).toBeTruthy();
    });

    it('"Descanso" label is visible', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('Descanso');
    });

    it('countdown displays formatted time mm:ss', () => {
      // remaining = 90 → 1:30
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('1:30');
    });

    it('"Saltar" button is present', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Saltar descanso"]');
      expect(btn).toBeTruthy();
      expect(btn!.textContent?.trim()).toBe('Saltar');
    });

    it('"+15s" button is present with an accessible name', () => {
      const btn = (fixture.nativeElement as HTMLElement).querySelector('button[aria-label="Sumar 15 segundos al descanso"]');
      expect(btn).toBeTruthy();
      expect(btn!.textContent?.trim()).toBe('+15s');
    });

    it('clicking "+15s" restarts the countdown with 15 more seconds through the same service', () => {
      mockService.remaining.set(84);
      fixture.detectChanges();
      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        'button[aria-label="Sumar 15 segundos al descanso"]',
      )!;
      btn.click();
      expect(mockService.start).toHaveBeenCalledWith(99);
      expect(mockService.skip).not.toHaveBeenCalled();
    });

    it('the progress fill shows the share of rest still remaining', () => {
      const fill = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.progress-fill')!;
      // First render: nothing elapsed -> full track
      expect(fill.style.width).toBe('100%');
      mockService.remaining.set(45);
      fixture.detectChanges();
      expect(fill.style.width).toBe('50%');
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
      const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        'button[aria-label="Saltar descanso"]',
      )!;
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
      const bar = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="timer"]');
      expect(bar).toBeNull();
    });

    it('no content rendered when timer is inactive', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
      expect(text).toBe('');
    });
  });
});
