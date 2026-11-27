import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FgButtonComponent, FgCardComponent, FgEmptyStateComponent, FgPageHeaderComponent } from '@core/shared/ui';
import { distinctUntilChanged, from, map, startWith, switchMap } from 'rxjs';
import type { Activity } from '../../domain/activity.entity';
import { ActivityNotFoundError } from '../../domain/errors/activity-not-found.error';
import { DeleteActivityUseCase } from '../../domain/use-cases/delete-activity.use-case';
import { GetActivityUseCase } from '../../domain/use-cases/get-activity.use-case';
import { RouteMapComponent } from '../components/route-map.component';
import {
  activityTypeLabels, formatActivityDate, formatDistance, formatDuration, formatElevationGain, formatSpeed,
} from '../format/activity-format';

type DetailState = { kind: 'loading' | 'not-found' | 'error' } | { kind: 'ready'; activity: Activity };
const loading: DetailState = { kind: 'loading' };

@Component({
  selector: 'fg-activity-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FgButtonComponent, FgCardComponent, FgEmptyStateComponent, FgPageHeaderComponent, RouteMapComponent],
  template: `
    @let detail = state();
    @if (detail.kind === 'ready') {
      <fg-page-header
        [title]="detail.activity.name"
        [subtitle]="typeLabels[detail.activity.type] + ' · ' + date(detail.activity.startedAt ?? detail.activity.importedAt)"
        class="break-words"
      />
    } @else {
      <fg-page-header title="Actividades" />
    }

    <div class="flex flex-col gap-3 px-4 pt-3 pb-6">
      @if (detail.kind !== 'not-found') {
        <a routerLink="/activities" class="inline-flex min-h-11 items-center self-start rounded-lg text-sm font-medium text-accent-ink underline">
          Volver a Actividades
        </a>
      }

      @switch (detail.kind) {
        @case ('loading') {
          <p role="status" class="text-sm text-ink-2">Cargando recorrido…</p>
        }
        @case ('error') {
          <p role="alert" class="text-sm text-danger">No se pudo cargar el recorrido.</p>
        }
        @case ('not-found') {
          <fg-empty-state title="No encontramos este recorrido" icon="pin">
            <a fgEmptyAction routerLink="/activities" class="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-accent-ink underline">
              Volver a Actividades
            </a>
          </fg-empty-state>
        }
        @case ('ready') {
          @let stats = detail.activity.stats;
          @if (detail.activity.points.length >= 2) {
            <fg-route-map [points]="detail.activity.points" />
          }
          <fg-card>
            <dl class="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt class="text-sm text-ink-2">Distancia</dt>
                <dd class="font-mono text-ink">{{ distance(stats.distanceMeters) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-ink-2">Tiempo total</dt>
                <dd class="font-mono text-ink">{{ duration(stats.elapsedSeconds) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-ink-2">Tiempo en movimiento</dt>
                <dd class="font-mono text-ink">{{ duration(stats.movingSeconds) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-ink-2">Velocidad media</dt>
                <dd class="font-mono text-ink">{{ speed(stats.avgSpeedKmh) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-ink-2">Desnivel positivo</dt>
                <dd class="font-mono text-ink">{{ elevationGain(stats.elevationGainMeters) }}</dd>
              </div>
            </dl>
          </fg-card>

          @if (confirmingDelete()) {
            <fg-card>
              <div role="group" aria-labelledby="delete-activity-prompt" class="flex flex-col gap-2">
                <p id="delete-activity-prompt" class="font-medium text-ink">
                  ¿Borrar este recorrido? No se puede deshacer.
                </p>
                <div class="flex gap-2">
                  <button type="button" fg-button variant="destructive" class="flex-1" [disabled]="deleting()" (click)="deleteActivity()">
                    Borrar
                  </button>
                  <button type="button" fg-button variant="ghost" class="flex-1" [disabled]="deleting()" (click)="confirmingDelete.set(false)">
                    Cancelar
                  </button>
                </div>
              </div>
            </fg-card>
          } @else {
            <button type="button" fg-button variant="destructive" class="self-start" [disabled]="deleting()" (click)="confirmingDelete.set(true)">
              Borrar recorrido
            </button>
          }
          @if (deleteError()) {
            <p role="alert" class="text-sm text-danger">No se pudo borrar el recorrido.</p>
          }
        }
      }
    </div>
  `,
})
export class ActivityDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getter = inject(GetActivityUseCase);
  private readonly deleter = inject(DeleteActivityUseCase);
  private destroyed = false;

  protected readonly confirmingDelete = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal(false);
  protected readonly state = toSignal(this.route.paramMap.pipe(
    map((params) => params.get('id') ?? ''),
    distinctUntilChanged(),
    switchMap((id) => {
      this.confirmingDelete.set(false);
      this.deleteError.set(false);
      return from(this.loadActivity(id)).pipe(startWith(loading));
    }),
  ), { initialValue: loading });

  protected readonly typeLabels = activityTypeLabels;
  protected readonly date = formatActivityDate;
  protected readonly distance = formatDistance;
  protected readonly duration = formatDuration;
  protected readonly speed = formatSpeed;
  protected readonly elevationGain = formatElevationGain;

  constructor() {
    inject(DestroyRef).onDestroy(() => { this.destroyed = true; });
  }

  protected async deleteActivity(): Promise<void> {
    const detail = this.state();
    if (detail.kind !== 'ready' || !this.confirmingDelete() || this.deleting()) return;
    this.deleting.set(true);
    this.deleteError.set(false);
    try {
      await this.deleter.execute(detail.activity.id);
      if (!this.destroyed && this.state() === detail) {
        this.confirmingDelete.set(false);
        await this.router.navigate(['/activities']);
      }
    } catch {
      if (this.state() === detail) this.deleteError.set(true);
    } finally {
      this.deleting.set(false);
    }
  }

  private async loadActivity(id: string): Promise<DetailState> {
    try {
      return { kind: 'ready', activity: await this.getter.execute(id) };
    } catch (error) {
      return { kind: error instanceof ActivityNotFoundError ? 'not-found' : 'error' };
    }
  }
}
