import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SetPreferredUnitUseCase } from '../../domain/use-cases/set-preferred-unit.use-case';
import { PreferredUnit } from '../../domain/value-objects/preferred-unit.vo';
import { ClearTrainingHistoryUseCase } from '@core/shared/domain/use-cases/clear-training-history.use-case';
import { TrainingHistoryReset } from '@core/shared/domain/training-history-reset';
import { DexieTrainingHistoryReset } from '@core/shared/data/dexie-training-history-reset';
import { PwaInstallService } from '@core/pwa/pwa-install.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { AccentId, AppearanceService, ThemePreference } from '@core/appearance/appearance.service';
import { RestPreferencesService } from '@core/rest-preferences/rest-preferences.service';
import { ScreenWakeLockService } from '@core/wake-lock/screen-wake-lock.service';
import { FileDownloadService } from '@core/files/file-download.service';
import { ExportHistoryCsvUseCase } from '@features/progress/domain/use-cases/export-history-csv.use-case';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import { FgButtonComponent, FgIconComponent } from '@core/shared/ui';

const THEME_OPTIONS: readonly { id: ThemePreference; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'system', label: 'Sistema' },
];

/** Swatch colors from the C canvas; Tinta flips to the light ink in dark mode, like the accent itself. */
const ACCENT_OPTIONS: readonly { id: AccentId; label: string; light: string; dark: string }[] = [
  { id: 'cobalt', label: 'Cobalto', light: '#2B59FF', dark: '#2B59FF' },
  { id: 'orange', label: 'Naranja', light: '#FF5A1F', dark: '#FF5A1F' },
  { id: 'green', label: 'Verde', light: '#0F9D76', dark: '#0F9D76' },
  { id: 'ink', label: 'Tinta', light: '#111113', dark: '#EDEDEA' },
];

const UNIT_OPTIONS: readonly PreferredUnit[] = ['kg', 'lb'];

const REST_STEP_SECONDS = 15;

/** YYYY-MM-DD in the device's time zone, for the export file name. */
function localDateStamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

@Component({
  selector: 'fg-profile-page',
  standalone: true,
  imports: [FgButtonComponent, FgIconComponent],
  providers: [
    ClearTrainingHistoryUseCase,
    { provide: TrainingHistoryReset, useClass: DexieTrainingHistoryReset },
  ],
  template: `
    <section class="bg-page text-ink flex flex-col gap-[14px] px-4 pt-5 pb-6">
      <header>
        <h1 class="text-[32px] leading-9 font-bold tracking-[-0.03em] text-ink">Perfil</h1>
      </header>

      <!-- Apariencia -->
      <section class="flex flex-col gap-1.5" aria-labelledby="look-title">
        <h2 id="look-title" class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">
          Apariencia
        </h2>
        <div class="bg-surface border border-line rounded-lg">
          <div class="flex items-center justify-between gap-2 min-h-14 pl-3.5 pr-2.5 border-b border-line-soft">
            <span class="text-[15px] font-medium">Tema</span>
            <div role="radiogroup" aria-label="Tema" class="flex gap-0.5 p-0.5 rounded-md border border-line bg-page">
              @for (option of themeOptions; track option.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="appearance.theme() === option.id"
                  class="h-8 px-3 rounded-sm text-[13px]"
                  [class]="appearance.theme() === option.id
                    ? 'bg-surface text-accent-ink font-semibold'
                    : 'bg-transparent text-ink-2 font-medium'"
                  (click)="appearance.setTheme(option.id)"
                >{{ option.label }}</button>
              }
            </div>
          </div>
          <div class="flex items-center justify-between gap-2 min-h-14 pl-3.5 pr-2.5">
            <span class="text-[15px] font-medium">Color de acento</span>
            <div role="radiogroup" aria-label="Color de acento" class="flex gap-1">
              @for (option of accentOptions; track option.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="appearance.accent() === option.id"
                  [attr.aria-label]="option.label"
                  class="w-10 h-10 rounded-full flex items-center justify-center"
                  (click)="appearance.setAccent(option.id)"
                >
                  <span
                    class="w-[26px] h-[26px] rounded-full"
                    [style.background]="swatchColor(option)"
                    [style.box-shadow]="appearance.accent() === option.id
                      ? '0 0 0 2px rgb(var(--color-surface)), 0 0 0 4px ' + swatchColor(option)
                      : 'none'"
                  ></span>
                </button>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Entrenamiento -->
      <section class="flex flex-col gap-1.5" aria-labelledby="train-title">
        <h2 id="train-title" class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">
          Entrenamiento
        </h2>
        <div class="bg-surface border border-line rounded-lg">
          <div class="flex items-center justify-between gap-2 min-h-[52px] pl-3.5 pr-2.5 border-b border-line-soft">
            <span class="text-[15px] font-medium">Unidad de peso</span>
            <div role="radiogroup" aria-label="Unidad de peso" class="flex gap-0.5 p-0.5 rounded-md border border-line bg-page">
              @for (option of unitOptions; track option) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="unit() === option"
                  class="h-8 min-w-11 px-2.5 rounded-sm font-mono text-[13px]"
                  [class]="unit() === option ? 'bg-surface text-accent-ink font-medium' : 'bg-transparent text-ink-2'"
                  (click)="onUnitChange(option)"
                >{{ option }}</button>
              }
            </div>
          </div>

          <div class="border-b border-line-soft">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-2 min-h-[52px] pl-3.5 pr-3 bg-transparent text-ink text-left"
              aria-controls="rest-default-panel"
              [attr.aria-expanded]="editingRest()"
              (click)="editingRest.set(!editingRest())"
            >
              <span class="text-[15px] font-medium">Descanso por defecto</span>
              <span class="flex items-center gap-1.5 text-ink-2">
                <span class="font-mono text-sm text-ink">{{ restLabel() }}</span>
                <fg-icon
                  name="chevron-right"
                  [size]="16"
                  class="transition-transform"
                  [class.rotate-90]="editingRest()"
                ></fg-icon>
              </span>
            </button>
            @if (editingRest()) {
              <div id="rest-default-panel" class="flex items-center justify-between gap-2 px-3.5 pb-3">
                <span class="text-[12px] text-ink-2">Para ejercicios sin descanso propio</span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Restar 15 segundos"
                    class="h-9 px-3 rounded-md border border-line bg-page font-mono text-[13px] text-ink disabled:opacity-40"
                    [disabled]="rest.defaultSeconds() === 0"
                    (click)="stepRest(-restStep)"
                  >−15s</button>
                  <button
                    type="button"
                    aria-label="Sumar 15 segundos"
                    class="h-9 px-3 rounded-md border border-line bg-page font-mono text-[13px] text-ink"
                    (click)="stepRest(restStep)"
                  >+15s</button>
                </div>
              </div>
            }
          </div>

          <div class="flex items-center justify-between gap-2 min-h-[52px] py-2 px-3.5 border-b border-line-soft">
            <span class="flex flex-col" [class.opacity-60]="!wakeLock.supported">
              <span class="text-[15px] font-medium">Pantalla siempre encendida</span>
              <span class="text-[12px] text-ink-2">
                {{ wakeLock.supported ? 'Durante la sesión' : 'Tu navegador no permite mantener la pantalla encendida.' }}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-label="Pantalla siempre encendida"
              [attr.aria-checked]="wakeLock.enabled()"
              [disabled]="!wakeLock.supported"
              class="w-[46px] h-7 flex-none rounded-full p-[3px] flex disabled:opacity-40"
              [class]="wakeLock.enabled() ? 'bg-accent justify-end' : 'bg-dash justify-start'"
              (click)="wakeLock.setEnabled(!wakeLock.enabled())"
            >
              <span class="w-[22px] h-[22px] rounded-full bg-white"></span>
            </button>
          </div>

          <div class="flex flex-col gap-2 py-2 px-3.5">
            <div class="flex items-center justify-between gap-2 min-h-9">
              <span class="flex flex-col">
                <span class="text-[15px] font-medium">Aviso al terminar el descanso</span>
                <span class="text-[12px] text-ink-2">Sonido y notificación</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-label="Aviso al terminar el descanso"
                [attr.aria-checked]="rest.alertOnEnd()"
                class="w-[46px] h-7 flex-none rounded-full p-[3px] flex"
                [class]="rest.alertOnEnd() ? 'bg-accent justify-end' : 'bg-dash justify-start'"
                (click)="rest.setAlertOnEnd(!rest.alertOnEnd())"
              >
                <span class="w-[22px] h-[22px] rounded-full bg-white"></span>
              </button>
            </div>
            @if (rest.alertOnEnd()) {
              @if (!notificationService.supported()) {
                <p class="text-[12px] text-ink-2">Las notificaciones requieren instalar la app primero.</p>
              } @else if (notificationService.permission() === 'default') {
                <button
                  type="button"
                  class="self-start text-[13px] font-semibold text-accent-ink"
                  (click)="onRequestNotification()"
                >Permitir notificaciones</button>
              } @else if (notificationService.permission() === 'denied') {
                <p class="text-[12px] text-ink-2">Notificaciones bloqueadas en el navegador: solo suena el aviso.</p>
              }
            }
          </div>
        </div>
      </section>

      <!-- Datos -->
      <section class="flex flex-col gap-1.5" aria-labelledby="data-title">
        <h2 id="data-title" class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">
          Datos
        </h2>
        <div class="bg-surface border border-line rounded-lg">
          @if (pwaInstallService.canInstall()) {
            <button
              type="button"
              class="w-full flex items-center justify-between min-h-12 pl-3.5 pr-3 border-b border-line-soft bg-transparent text-ink text-[15px] font-medium text-left"
              (click)="onInstallApp()"
            >
              Instalar Forge en el inicio
              <fg-icon name="chevron-right" [size]="16" class="text-ink-2"></fg-icon>
            </button>
          }
          <button
            type="button"
            class="w-full flex items-center justify-between min-h-12 pl-3.5 pr-3 border-b border-line-soft bg-transparent text-ink text-[15px] font-medium text-left disabled:opacity-60"
            [disabled]="exporting()"
            (click)="onExportHistory()"
          >
            Exportar historial (CSV)
            <fg-icon name="chevron-right" [size]="16" class="text-ink-2"></fg-icon>
          </button>
          @if (!confirmingClear()) {
            <button
              type="button"
              class="w-full flex items-center min-h-12 px-3.5 bg-transparent text-danger text-[15px] font-semibold text-left"
              (click)="confirmingClear.set(true)"
            >Borrar historial</button>
          } @else {
            <div class="flex flex-col gap-2 p-3.5">
              <span class="text-[15px] font-medium text-ink">
                ¿Borrar todo el historial de entrenamiento? No se puede deshacer.
              </span>
              <span class="text-[12px] text-ink-2">
                Borra rutinas, sesiones e historial de entrenamiento. Conserva perfil y ejercicios.
              </span>
              <div class="flex gap-2">
                <button
                  type="button"
                  fg-button
                  variant="destructive"
                  class="flex-1"
                  [disabled]="clearing()"
                  (click)="onClearHistory()"
                >Borrar</button>
                <button
                  type="button"
                  fg-button
                  variant="ghost"
                  class="flex-1"
                  (click)="confirmingClear.set(false)"
                >Cancelar</button>
              </div>
            </div>
          }
        </div>
        <span class="text-[12px] leading-4 text-ink-2">Tus datos se guardan solo en este dispositivo.</span>
      </section>
    </section>
  `,
})
export class ProfilePage implements OnInit {
  private readonly setPreferredUnitUseCase = inject(SetPreferredUnitUseCase);
  private readonly clearHistoryUseCase = inject(ClearTrainingHistoryUseCase);
  private readonly toastService = inject(ToastService);
  private readonly userPreferences = inject(UserPreferencesService);
  private readonly exportHistoryCsvUseCase = inject(ExportHistoryCsvUseCase);
  private readonly fileDownload = inject(FileDownloadService);
  readonly appearance = inject(AppearanceService);
  readonly rest = inject(RestPreferencesService);
  readonly wakeLock = inject(ScreenWakeLockService);
  readonly pwaInstallService = inject(PwaInstallService);
  readonly notificationService = inject(NotificationPermissionService);

  readonly themeOptions = THEME_OPTIONS;
  readonly accentOptions = ACCENT_OPTIONS;
  readonly unitOptions = UNIT_OPTIONS;
  readonly restStep = REST_STEP_SECONDS;

  readonly unit = this.userPreferences.unit;
  readonly editingRest = signal(false);
  readonly exporting = signal(false);
  readonly confirmingClear = signal(false);
  readonly clearing = signal(false);

  readonly restLabel = computed(() => {
    const seconds = this.rest.defaultSeconds();
    const s = seconds % 60;
    return `${Math.floor(seconds / 60)}:${s < 10 ? `0${s}` : s}`;
  });

  ngOnInit(): void {
    void this.userPreferences.loadOnce();
  }

  swatchColor(option: (typeof ACCENT_OPTIONS)[number]): string {
    return this.appearance.resolvedTheme() === 'dark' ? option.dark : option.light;
  }

  /** Applies the unit app-wide right away; restores the previous one if saving fails. */
  async onUnitChange(unit: PreferredUnit): Promise<void> {
    const previous = this.unit();
    if (unit === previous) return;
    this.unit.set(unit);
    try {
      await this.setPreferredUnitUseCase.execute(unit);
    } catch (err) {
      this.unit.set(previous);
      this.toastService.error(err instanceof Error ? err.message : 'Error al guardar la unidad');
    }
  }

  stepRest(delta: number): void {
    this.rest.setDefaultSeconds(Math.max(0, this.rest.defaultSeconds() + delta));
  }

  /** "Exportar historial (CSV)": every set of every completed session, in the preferred unit (D2). */
  async onExportHistory(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const { content, rowCount } = await this.exportHistoryCsvUseCase.execute(this.unit());
      if (rowCount === 0) {
        this.toastService.info('Todavía no hay series para exportar.');
        return;
      }
      this.fileDownload.downloadCsv(`forge-historial-${localDateStamp(new Date())}.csv`, content);
    } catch (err) {
      this.toastService.error('No se pudo exportar el historial', err instanceof Error ? err.message : undefined);
    } finally {
      this.exporting.set(false);
    }
  }

  async onInstallApp(): Promise<void> {
    await this.pwaInstallService.install();
  }

  onRequestNotification(): void {
    void this.notificationService.request();
  }

  async onClearHistory(): Promise<void> {
    this.clearing.set(true);
    try {
      await this.clearHistoryUseCase.execute();
      this.toastService.success('Historial borrado');
      this.confirmingClear.set(false);
    } catch (err) {
      this.toastService.error(err instanceof Error ? err.message : 'Error al borrar historial');
    } finally {
      this.clearing.set(false);
    }
  }
}
