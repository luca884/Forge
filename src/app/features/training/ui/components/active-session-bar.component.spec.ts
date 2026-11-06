import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ActiveSessionBarComponent } from './active-session-bar.component';
import { SessionRepository } from '../../domain/session.repository';
import { TrainingDayRepository } from '../../../routines/domain/training-day.repository';
import { GetActiveSessionUseCase } from '../../domain/use-cases/get-active-session.use-case';
import { EventBus } from '@core/shared/events/event-bus';
import { InMemoryEventBus } from '@core/shared/events/in-memory-event-bus';
import type { TrainingHistoryClearedEvent } from '@core/shared/events/training-history-cleared.event';

@Component({ standalone: true, template: '' })
class BlankPage {}

describe('ActiveSessionBarComponent', () => {
  let fixture: ComponentFixture<ActiveSessionBarComponent>;
  const getActive = jest.fn();
  const getDay = jest.fn();
  const link = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a');

  async function render(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ActiveSessionBarComponent],
      providers: [
        provideRouter([{ path: 'training/session', component: BlankPage }]),
        { provide: EventBus, useClass: InMemoryEventBus },
      ],
    })
      .overrideComponent(ActiveSessionBarComponent, {
        set: {
          providers: [
            { provide: SessionRepository, useValue: { getActive } },
            { provide: TrainingDayRepository, useValue: { getById: getDay } },
            GetActiveSessionUseCase,
          ],
        },
      })
      .compileComponents();
    fixture = TestBed.createComponent(ActiveSessionBarComponent);
    fixture.detectChanges();
    // ngOnInit awaits two repository calls: let them resolve before rendering again.
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(() => {
    getActive.mockReset();
    getDay.mockReset();
  });

  it('renders nothing when there is no session in progress', async () => {
    getActive.mockResolvedValue(null);
    await render();
    expect(link()).toBeNull();
  });

  it('names the day of the session in progress and links to it', async () => {
    getActive.mockResolvedValue({ id: 's-1', dayId: 'd-1' });
    getDay.mockResolvedValue({ id: 'd-1', name: 'Torso A' });
    await render();
    expect(link()!.textContent).toContain('Torso A');
    expect(link()!.getAttribute('aria-label')).toBe('Continuar entrenamiento en curso: Torso A');
    link()!.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/training/session');
  });

  it('disappears when the training history is cleared (the session in progress goes with it)', async () => {
    getActive.mockResolvedValue({ id: 's-1', dayId: 'd-1' });
    getDay.mockResolvedValue({ id: 'd-1', name: 'Torso A' });
    await render();
    expect(link()).not.toBeNull();
    TestBed.inject(EventBus).publish<TrainingHistoryClearedEvent>({ name: 'TrainingHistoryCleared', occurredAt: new Date() });
    fixture.detectChanges();
    expect(link()).toBeNull();
  });

  it('falls back to a generic name when the day no longer exists', async () => {
    getActive.mockResolvedValue({ id: 's-1', dayId: 'gone' });
    getDay.mockResolvedValue(null);
    await render();
    expect(link()!.textContent).toContain('Entrenamiento');
  });
});
