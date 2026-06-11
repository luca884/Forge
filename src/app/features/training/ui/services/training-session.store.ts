import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
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

  /** Private tick signal — incremented every second to drive elapsedSeconds recomputation. */
  private readonly tick = signal(0);

  /** Interval handle — must be cleared on destroy (CC-7). */
  private readonly intervalHandle = setInterval(() => this.tick.update(n => n + 1), 1000);

  /** Elapsed seconds since the active session started. Returns 0 when no session is active. */
  readonly elapsedSeconds = computed(() => {
    this.tick(); // creates reactive dependency — forces recomputation on each tick
    const s = this.activeSession();
    if (!s) return 0;
    return Math.max(0, Math.floor((Date.now() - s.startedAt.getTime()) / 1000));
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.intervalHandle));
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

  /** Limpia el estado en memoria de la sesión activa y sus sets. Usado al cancelar. */
  clear(): void {
    this.activeSession.set(null);
    this.workedSets.set([]);
  }
}
