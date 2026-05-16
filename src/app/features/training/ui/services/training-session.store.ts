import { Injectable, inject, signal, computed } from '@angular/core';
import { Session } from '../../domain/session.entity';
import { WorkedSet } from '../../domain/worked-set';
import { SessionRepository } from '../../domain/session.repository';
import { EventBus } from '@core/shared/events/event-bus';

@Injectable()
export class TrainingSessionStore {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly eventBus = inject(EventBus);

  readonly activeSession = signal<Session | null>(null);
  readonly workedSets = signal<readonly WorkedSet[]>([]);

  readonly setsByExercise = computed(() => {
    const map = new Map<string, WorkedSet[]>();
    for (const set of this.workedSets()) {
      const arr = map.get(set.exerciseId) ?? [];
      arr.push(set);
      map.set(set.exerciseId, arr);
    }
    return map;
  });

  constructor() {
    this.eventBus.subscribe('WorkedSetLogged', () => void this.refreshSets());
    this.eventBus.subscribe('WorkedSetEdited', () => void this.refreshSets());
    this.eventBus.subscribe('WorkedSetRemoved', () => void this.refreshSets());
  }

  async loadActive(): Promise<void> {
    const session = await this.sessionRepo.getActive();
    this.activeSession.set(session);
  }

  async refreshSets(): Promise<void> {
    const session = this.activeSession();
    if (!session) return;

    const sets = await this.sessionRepo.getSetsForSession(session.id);
    this.workedSets.set(sets);
  }
}
