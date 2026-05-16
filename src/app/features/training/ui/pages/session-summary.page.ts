import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TrainingSessionStore } from '../services/training-session.store';
import { SessionRepository } from '../../domain/session.repository';
import { WorkedSet } from '../../domain/worked-set';
import { Session } from '../../domain/session.entity';

@Component({
  selector: 'fg-session-summary-page',
  standalone: true,
  template: `
    <div class="session-summary">
      <header class="session-summary__header">
        <h1>Sesión completada</h1>
        @if (session()) {
          <p class="session-summary__date">{{ session()!.date }}</p>
          @if (duration()) {
            <p class="session-summary__duration">Duración: {{ duration() }}</p>
          }
        }
      </header>

      <div class="session-summary__stats">
        <div class="session-summary__stat">
          <span class="session-summary__stat-value">{{ totalSets() }}</span>
          <span class="session-summary__stat-label">Series</span>
        </div>
        <div class="session-summary__stat">
          <span class="session-summary__stat-value">{{ totalPrs() }}</span>
          <span class="session-summary__stat-label">Records personales</span>
        </div>
      </div>

      @if (prSets().length > 0) {
        <div class="session-summary__prs">
          <h2>¡Nuevos récords!</h2>
          @for (set of prSets(); track set.id) {
            <div class="session-summary__pr-item">
              @switch (set.type) {
                @case ('weight-reps') {
                  <span>{{ set.reps.value }} reps × {{ set.weight.value }} kg</span>
                }
                @case ('bodyweight-reps') {
                  <span>{{ set.reps.value }} reps
                    @if (set.extraWeight) {
                      (+ {{ set.extraWeight.value }} kg)
                    }
                  </span>
                }
                @default {
                  <span>Récord registrado</span>
                }
              }
            </div>
          }
        </div>
      }

      <div class="session-summary__sets">
        <h2>Series registradas</h2>
        @for (set of workedSets(); track set.id) {
          <div class="session-summary__set" [class.session-summary__set--pr]="set.isPR">
            @switch (set.type) {
              @case ('weight-reps') {
                <span>{{ set.reps.value }} reps × {{ set.weight.value }} kg</span>
              }
              @case ('bodyweight-reps') {
                <span>{{ set.reps.value }} reps
                  @if (set.extraWeight) {
                    (+ {{ set.extraWeight.value }} kg)
                  }
                </span>
              }
              @case ('time') {
                <span>{{ set.durationSec }}s</span>
              }
              @case ('distance-time') {
                <span>{{ set.distanceKm }} km en {{ set.durationSec }}s</span>
              }
            }
            @if (set.isPR) {
              <span class="session-summary__pr-badge">PR</span>
            }
          </div>
        } @empty {
          <p>No se registraron series.</p>
        }
      </div>

      <button type="button" class="session-summary__done-btn" (click)="goHome()">
        Volver al inicio
      </button>
    </div>
  `,
})
export class SessionSummaryPage implements OnInit {
  private readonly store = inject(TrainingSessionStore);
  private readonly sessionRepo = inject(SessionRepository);
  private readonly router = inject(Router);

  readonly session = signal<Session | null>(null);
  readonly workedSets = signal<readonly WorkedSet[]>([]);

  readonly totalSets = computed(() => this.workedSets().length);
  readonly totalPrs = computed(() => this.workedSets().filter(s => s.isPR).length);
  readonly prSets = computed(() => this.workedSets().filter(s => s.isPR));

  readonly duration = computed(() => {
    const s = this.session();
    if (!s?.endedAt) return null;
    const ms = s.endedAt.getTime() - s.startedAt.getTime();
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  });

  async ngOnInit(): Promise<void> {
    const activeSession = this.store.activeSession();
    if (activeSession) {
      // Load the completed session from repo (it should now be status: completed)
      const completedSession = await this.sessionRepo.getById(activeSession.id);
      this.session.set(completedSession);

      // Load its sets
      if (completedSession) {
        const sets = await this.sessionRepo.getSetsForSession(completedSession.id);
        this.workedSets.set(sets);
      }
    } else {
      // No session in store — navigate home
      void this.router.navigate(['/training']);
    }
  }

  goHome(): void {
    void this.router.navigate(['/training']);
  }
}
