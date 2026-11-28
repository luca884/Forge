import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FgButtonComponent, FgCardComponent, FgPageHeaderComponent } from '@core/shared/ui';
import type { HealthDay } from '../../domain/health-day.entity';
import { HealthSource } from '../../domain/health-source';
import { localDayId } from '../../domain/local-day';
import { GetHealthDayUseCase } from '../../domain/use-cases/get-health-day.use-case';
import { SyncHealthUseCase, type SyncHealthResult } from '../../domain/use-cases/sync-health.use-case';
import { formatBpm, formatKcal, formatMeters, formatPercent, formatSteps } from '../format/health-format';

/** Primera sincronización (hoy sin datos) lee un mes; las siguientes solo la última semana. */
const FIRST_SYNC_DAYS = 30;
const REGULAR_SYNC_DAYS = 7;

function syncMessage(result: SyncHealthResult): string {
  switch (result.status) {
    case 'unavailable':
      return 'Health Connect no está disponible en este dispositivo.';
    case 'denied':
      return 'No diste permiso para leer Health Connect. Podés dárselo desde los permisos de la app.';
    case 'synced':
      if (result.days === 0) return 'No hay datos nuevos en Health Connect.';
      return `Sincronizado: ${result.days} ${result.days === 1 ? 'día' : 'días'}.`;
  }
}

@Component({
  selector: 'fg-health-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FgButtonComponent, FgCardComponent, FgPageHeaderComponent],
  template: `
    <fg-page-header title="Salud" />

    <div class="flex flex-col gap-3 px-4 pt-3 pb-6">
      @if (loadError()) {
        <p role="alert" class="text-sm text-danger">No se pudieron cargar los datos de salud.</p>
      } @else if (loaded()) {
        @let day = today();
        <fg-card>
          <h2 class="font-semibold text-ink">Hoy</h2>
          <dl class="mt-2 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div>
              <dt class="text-xs text-ink-2">Pasos</dt>
              <dd class="font-mono text-ink">{{ steps(day?.steps ?? null) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-2">Distancia</dt>
              <dd class="font-mono text-ink">{{ meters(day?.distanceMeters ?? null) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-2">Calorías</dt>
              <dd class="font-mono text-ink">{{ kcal(day?.caloriesKcal ?? null) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-ink-2">Frecuencia cardíaca</dt>
              <dd class="font-mono text-ink">{{ bpm(day?.heartRate?.avg ?? null) }}</dd>
              @if (day?.heartRate; as heartRate) {
                <dd class="font-mono text-xs text-ink-2">{{ heartRate.min }}–{{ heartRate.max }} lpm</dd>
              }
            </div>
            <div>
              <dt class="text-xs text-ink-2">Saturación de oxígeno</dt>
              <dd class="font-mono text-ink">{{ percent(day?.oxygenSaturation?.avg ?? null) }}</dd>
            </div>
          </dl>
          @if (!day) {
            <p class="mt-3 text-sm text-ink-2">Todavía no hay datos de hoy.</p>
          }
        </fg-card>
      } @else {
        <p role="status" class="text-sm text-ink-2">Cargando datos de salud…</p>
      }

      @if (canSync()) {
        <button type="button" fg-button class="self-start" [disabled]="syncing()" (click)="onSync()">
          Sincronizar con Health Connect
        </button>
      } @else if (sourceChecked()) {
        <p class="text-sm text-ink-2">
          Leer datos nuevos solo funciona en la app de Android con Health Connect. Acá ves los datos ya guardados.
        </p>
      }
      @if (syncError()) {
        <p role="alert" class="text-sm text-danger">No se pudo sincronizar. Probá de nuevo.</p>
      } @else {
        @if (syncResult(); as message) {
          <p role="status" class="text-sm text-ink-2">{{ message }}</p>
        }
      }
    </div>
  `,
})
export class HealthPage implements OnInit {
  private readonly getDay = inject(GetHealthDayUseCase);
  private readonly syncHealth = inject(SyncHealthUseCase);
  private readonly source = inject(HealthSource);

  protected readonly today = signal<HealthDay | null>(null);
  protected readonly loaded = signal(false);
  protected readonly loadError = signal(false);
  protected readonly sourceChecked = signal(false);
  protected readonly canSync = signal(false);
  protected readonly syncing = signal(false);
  protected readonly syncResult = signal<string | null>(null);
  protected readonly syncError = signal(false);

  protected readonly steps = formatSteps;
  protected readonly meters = formatMeters;
  protected readonly kcal = formatKcal;
  protected readonly bpm = formatBpm;
  protected readonly percent = formatPercent;

  ngOnInit(): void {
    void this.load();
    void this.checkSource();
  }

  protected async onSync(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncError.set(false);
    this.syncResult.set(null);
    try {
      const days = this.today() ? REGULAR_SYNC_DAYS : FIRST_SYNC_DAYS;
      const result = await this.syncHealth.execute({ now: new Date(), days });
      this.syncResult.set(syncMessage(result));
      if (result.status === 'synced') await this.load();
    } catch {
      this.syncError.set(true);
    } finally {
      this.syncing.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      this.today.set(await this.getDay.execute(localDayId(new Date())));
      this.loadError.set(false);
      this.loaded.set(true);
    } catch {
      this.loadError.set(true);
    }
  }

  private async checkSource(): Promise<void> {
    try {
      this.canSync.set(await this.source.isAvailable());
    } catch {
      this.canSync.set(false);
    }
    this.sourceChecked.set(true);
  }
}
