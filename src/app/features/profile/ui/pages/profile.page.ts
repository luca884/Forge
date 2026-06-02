import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Profile } from '../../domain/profile.entity';
import { GetUserProfileUseCase } from '../../domain/use-cases/get-user-profile.use-case';
import { SetUserProfileUseCase } from '../../domain/use-cases/set-user-profile.use-case';
import { ClearTrainingHistoryUseCase } from '@core/shared/domain/use-cases/clear-training-history.use-case';
import { TrainingHistoryReset } from '@core/shared/domain/training-history-reset';
import { DexieTrainingHistoryReset } from '@core/shared/data/dexie-training-history-reset';
import { PwaInstallService } from '@core/pwa/pwa-install.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';
import { ToastService } from '@core/shared/ui/toast/toast.service';
import {
  FgPageHeaderComponent,
  FgInputComponent,
  FgButtonComponent,
  FgCardComponent,
} from '@core/shared/ui';

@Component({
  selector: 'fg-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FgPageHeaderComponent,
    FgInputComponent,
    FgButtonComponent,
    FgCardComponent,
  ],
  providers: [
    ClearTrainingHistoryUseCase,
    { provide: TrainingHistoryReset, useClass: DexieTrainingHistoryReset },
  ],
  template: `
    <fg-page-header title="Perfil"></fg-page-header>

    <div class="px-4 pt-3 pb-6 flex flex-col gap-4">
      @if (isLoading()) {
        <p class="t-body text-forge-400">Cargando...</p>
      } @else if (profile() === null) {
        <!-- Primera vez: setup inicial inline -->
        <fg-card>
          <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="flex flex-col gap-4">
            <h2 class="t-h3 text-forge-100">Configurá tu perfil</h2>

            <div class="flex flex-col gap-1.5">
              <fg-input label="Nombre" placeholder="Tu nombre" formControlName="name"></fg-input>
              @if (profileForm.get('name')?.invalid && profileForm.get('name')?.touched) {
                <span class="t-caption text-destructive">El nombre es requerido</span>
              }
            </div>

            <label class="flex flex-col gap-1.5">
              <span class="t-caption text-forge-300">Unidad de peso</span>
              <select
                formControlName="preferredUnit"
                class="h-11 px-3 rounded-md bg-forge-900 border border-forge-700 text-forge-100 t-body outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </label>

            <button
              type="submit"
              fg-button
              variant="primary"
              size="lg"
              class="w-full"
              [disabled]="profileForm.invalid || isSaving()"
            >
              Guardar perfil
            </button>
          </form>
        </fg-card>
      } @else {
        <!-- Configuración existente -->
        <fg-card>
          <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <fg-input label="Nombre" formControlName="name"></fg-input>
              @if (profileForm.get('name')?.invalid && profileForm.get('name')?.touched) {
                <span class="t-caption text-destructive">El nombre es requerido</span>
              }
            </div>

            <label class="flex flex-col gap-1.5">
              <span class="t-caption text-forge-300">Unidad de peso</span>
              <select
                formControlName="preferredUnit"
                class="h-11 px-3 rounded-md bg-forge-900 border border-forge-700 text-forge-100 t-body outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </label>

            <div class="flex flex-col gap-1.5">
              <span class="t-caption text-forge-300">Avatar (opcional)</span>
              <input
                type="file"
                accept="image/*"
                (change)="onAvatarChange($event)"
                class="t-body-sm text-forge-300 file:mr-3 file:rounded-md file:border-0 file:bg-forge-850 file:px-3 file:py-2 file:text-forge-100"
              />
              @if (profile()?.avatarBase64) {
                <img
                  [src]="profile()!.avatarBase64"
                  alt="Avatar"
                  class="mt-2 h-20 w-20 rounded-full object-cover"
                />
                <button type="button" fg-button variant="ghost" size="sm" (click)="clearAvatar()">
                  Quitar foto
                </button>
              }
            </div>

            <button
              type="submit"
              fg-button
              variant="primary"
              size="lg"
              class="w-full"
              [disabled]="profileForm.invalid || isSaving()"
            >
              Guardar cambios
            </button>
          </form>
        </fg-card>
      }

      <!-- Sección PWA -->
      @if (pwaInstallService.canInstall()) {
        <button
          type="button"
          fg-button
          variant="secondary"
          size="lg"
          class="w-full"
          (click)="onInstallApp()"
        >
          Instalar app
        </button>
      }

      <!-- Sección Notificaciones -->
      <fg-card>
        @if (notificationService.supported()) {
          <button
            type="button"
            fg-button
            variant="secondary"
            size="lg"
            class="w-full"
            (click)="onRequestNotification()"
          >
            Activar notificaciones
            <span class="text-forge-400">
              @if (notificationService.permission() === 'granted') {
                (concedido)
              } @else if (notificationService.permission() === 'denied') {
                (denegado)
              } @else {
                (pendiente)
              }
            </span>
          </button>
        } @else {
          <p class="t-body-sm text-forge-400">
            Las notificaciones requieren instalar la app primero.
          </p>
        }
      </fg-card>

      <!-- Zona de peligro -->
      <fg-card>
        @if (!confirmingClear()) {
          <div class="flex flex-col gap-2">
            <button
              type="button"
              fg-button
              variant="destructive"
              [leadingIcon]="'trash'"
              (click)="confirmingClear.set(true)"
              class="w-full"
            >
              Borrar historial
            </button>
            <p class="t-caption text-forge-400">
              Borra rutinas, sesiones e historial de entrenamiento. Conserva perfil y ejercicios.
            </p>
          </div>
        } @else {
          <div class="flex flex-col gap-2">
            <span class="t-body-sm text-forge-300">
              ¿Borrar todo el historial de entrenamiento? No se puede deshacer.
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
      </fg-card>

      @if (saveError()) {
        <p class="t-body-sm text-destructive" role="alert">{{ saveError() }}</p>
      }
    </div>
  `,
})
export class ProfilePage implements OnInit {
  private readonly getUserProfileUseCase = inject(GetUserProfileUseCase);
  private readonly setUserProfileUseCase = inject(SetUserProfileUseCase);
  private readonly clearHistoryUseCase = inject(ClearTrainingHistoryUseCase);
  private readonly toastService = inject(ToastService);
  readonly pwaInstallService = inject(PwaInstallService);
  readonly notificationService = inject(NotificationPermissionService);

  private readonly fb = inject(FormBuilder);

  readonly profile = signal<Profile | null | undefined>(undefined);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly confirmingClear = signal(false);
  readonly clearing = signal(false);

  private avatarBase64: string | undefined;

  readonly profileForm = this.fb.group({
    // eslint-disable-next-line @typescript-eslint/unbound-method
    name: ['', Validators.required],
    preferredUnit: ['kg'],
  });

  ngOnInit(): void {
    void this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    try {
      const existing = await this.getUserProfileUseCase.execute();
      this.profile.set(existing);
      if (existing) {
        this.profileForm.patchValue({
          name: existing.name,
          preferredUnit: existing.preferredUnit,
        });
        this.avatarBase64 = existing.avatarBase64;
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSave(): Promise<void> {
    if (this.profileForm.invalid) return;

    const { name, preferredUnit } = this.profileForm.value;
    if (!name) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.setUserProfileUseCase.execute({
        name,
        preferredUnit: (preferredUnit as 'kg' | 'lb') ?? 'kg',
        avatarBase64: this.avatarBase64,
      });
      // Reload profile to reflect changes
      const updated = await this.getUserProfileUseCase.execute();
      this.profile.set(updated);
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      this.isSaving.set(false);
    }
  }

  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  clearAvatar(): void {
    this.avatarBase64 = undefined;
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
