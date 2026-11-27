import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DomainError } from '@core/shared/domain/errors/domain-error';
import { FgButtonComponent, FgCardComponent, FgEmptyStateComponent, FgPageHeaderComponent } from '@core/shared/ui';
import type { ActivityType } from '../../domain/activity.entity';
import type { ActivitySummary } from '../../domain/activity.repository';
import { ActivityTypeRequiredError } from '../../domain/errors/activity-type-required.error';
import { ImportActivityUseCase, type ImportActivityInput } from '../../domain/use-cases/import-activity.use-case';
import { ListActivitiesUseCase } from '../../domain/use-cases/list-activities.use-case';
import { activityTypeLabels, formatActivityDate, formatDistance, formatDuration, formatSpeed } from '../format/activity-format';

const activityTypes: readonly ActivityType[] = ['walk', 'bike', 'run'];

@Component({
  selector: 'fg-activity-list-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FgButtonComponent, FgCardComponent, FgEmptyStateComponent, FgPageHeaderComponent],
  template: `
    <fg-page-header title="Actividades" />

    <div class="flex flex-col gap-3 px-4 pt-3 pb-6">
      @let items = activities();
      <input
        #gpxInput
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        hidden
        (change)="onFileInput(gpxInput)"
      />

      @if (items?.length === 0) {
        <fg-empty-state title="Todavía no importaste ningún recorrido" icon="pin">
          <button type="button" fgEmptyAction fg-button [disabled]="importing()" (click)="gpxInput.click()">
            Importar GPX
          </button>
        </fg-empty-state>
      } @else {
        <button type="button" fg-button class="self-start" [disabled]="importing()" (click)="gpxInput.click()">
          Importar GPX
        </button>
      }

      @if (pendingImport()) {
        <fg-card>
          <div role="group" aria-labelledby="activity-type-prompt" class="flex flex-col gap-2">
            <p id="activity-type-prompt" class="font-medium text-ink">¿Qué tipo de actividad es?</p>
            <div class="flex flex-wrap gap-2">
              @for (type of activityTypes; track type) {
                <button type="button" fg-button variant="secondary" [disabled]="importing()" (click)="chooseType(type)">
                  {{ typeLabels[type] }}
                </button>
              }
              <button type="button" fg-button variant="ghost" [disabled]="importing()" (click)="pendingImport.set(null)">
                Cancelar
              </button>
            </div>
          </div>
        </fg-card>
      }
      @if (importError(); as error) {
        <p role="alert" class="text-sm text-danger">{{ error }}</p>
      }

      @if (loadError()) {
        <p role="alert" class="text-sm text-danger">No se pudieron cargar los recorridos.</p>
      } @else if (items) {
        @if (items.length) {
          <ul role="list" class="flex flex-col gap-2">
            @for (activity of items; track activity.id) {
              <li>
                <fg-card [padding]="0">
                  <a
                    [routerLink]="['/activities', activity.id]"
                    class="flex flex-col gap-2 rounded-lg p-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <span class="break-words font-semibold text-ink">{{ activity.name }}</span>
                    <span class="text-sm text-ink-2">
                      {{ typeLabels[activity.type] }} · {{ date(activity.startedAt ?? activity.importedAt) }}
                    </span>
                    <dl class="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <dt class="text-xs text-ink-2">Distancia</dt>
                        <dd class="font-mono text-ink">{{ distance(activity.stats.distanceMeters) }}</dd>
                      </div>
                      <div>
                        <dt class="text-xs text-ink-2">Tiempo total</dt>
                        <dd class="font-mono text-ink">{{ duration(activity.stats.elapsedSeconds) }}</dd>
                      </div>
                      <div>
                        <dt class="text-xs text-ink-2">Velocidad media</dt>
                        <dd class="font-mono text-ink">{{ speed(activity.stats.avgSpeedKmh) }}</dd>
                      </div>
                    </dl>
                  </a>
                </fg-card>
              </li>
            }
          </ul>
        }
      } @else {
        <p role="status" class="text-sm text-ink-2">Cargando recorridos…</p>
      }
    </div>
  `,
})
export class ActivityListPage implements OnInit {
  private readonly list = inject(ListActivitiesUseCase);
  private readonly importer = inject(ImportActivityUseCase);
  private readonly router = inject(Router);

  protected readonly activities = signal<ActivitySummary[] | null>(null);
  protected readonly loadError = signal(false);
  protected readonly pendingImport = signal<ImportActivityInput | null>(null);
  protected readonly importing = signal(false);
  protected readonly importError = signal<string | null>(null);

  protected readonly activityTypes = activityTypes;
  protected readonly typeLabels = activityTypeLabels;
  protected readonly date = formatActivityDate;
  protected readonly distance = formatDistance;
  protected readonly duration = formatDuration;
  protected readonly speed = formatSpeed;

  ngOnInit(): void {
    void this.loadActivities();
  }

  protected onFileInput(input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.importing()) return;
    this.pendingImport.set(null);
    void this.importActivity(async () => ({ xml: await file.text(), fileName: file.name }));
  }

  protected chooseType(type: ActivityType): void {
    const input = this.pendingImport();
    if (input) void this.importActivity(() => ({ ...input, type }));
  }

  private async loadActivities(): Promise<void> {
    try {
      this.activities.set(await this.list.execute());
    } catch {
      this.loadError.set(true);
    }
  }

  private async importActivity(readInput: () => ImportActivityInput | Promise<ImportActivityInput>): Promise<void> {
    if (this.importing()) return;
    this.importing.set(true);
    this.importError.set(null);
    let input: ImportActivityInput | undefined;
    try {
      input = await readInput();
      const activity = await this.importer.execute(input);
      this.pendingImport.set(null);
      await this.router.navigate(['/activities', activity.id]);
    } catch (error) {
      if (input && input.type === undefined && error instanceof ActivityTypeRequiredError) {
        this.pendingImport.set(input);
      } else {
        this.pendingImport.set(null);
        this.importError.set(error instanceof DomainError ? error.message : 'No se pudo importar el recorrido.');
      }
    } finally {
      this.importing.set(false);
    }
  }
}
