import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Profile } from '../../domain/profile.entity';
import { GetUserProfileUseCase } from '../../domain/use-cases/get-user-profile.use-case';
import { SetUserProfileUseCase } from '../../domain/use-cases/set-user-profile.use-case';
import { PwaInstallService } from '@core/pwa/pwa-install.service';
import { NotificationPermissionService } from '@core/notifications/notification-permission.service';

@Component({
  selector: 'fg-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [GetUserProfileUseCase, SetUserProfileUseCase],
  template: `
    <div class="profile-page">
      <h1>Perfil</h1>

      @if (isLoading()) {
        <p>Cargando...</p>
      } @else if (profile() === null) {
        <!-- Primera vez: setup inicial inline -->
        <div class="first-run-setup">
          <h2>Configurá tu perfil</h2>
          <form [formGroup]="profileForm" (ngSubmit)="onSave()">
            <div class="form-field">
              <label for="name">Nombre</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="Tu nombre"
              />
              @if (profileForm.get('name')?.invalid && profileForm.get('name')?.touched) {
                <span class="error">El nombre es requerido</span>
              }
            </div>

            <div class="form-field">
              <label for="preferredUnit">Unidad de peso</label>
              <select id="preferredUnit" formControlName="preferredUnit">
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </div>

            <button type="submit" [disabled]="profileForm.invalid || isSaving()">
              Guardar perfil
            </button>
          </form>
        </div>
      } @else {
        <!-- Configuración existente -->
        <div class="profile-settings">
          <form [formGroup]="profileForm" (ngSubmit)="onSave()">
            <div class="form-field">
              <label for="name">Nombre</label>
              <input
                id="name"
                type="text"
                formControlName="name"
              />
              @if (profileForm.get('name')?.invalid && profileForm.get('name')?.touched) {
                <span class="error">El nombre es requerido</span>
              }
            </div>

            <div class="form-field">
              <label for="preferredUnit">Unidad de peso</label>
              <select id="preferredUnit" formControlName="preferredUnit">
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
              </select>
            </div>

            <div class="form-field">
              <label for="avatar">Avatar (opcional)</label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                (change)="onAvatarChange($event)"
              />
              @if (profile()?.avatarBase64) {
                <img
                  [src]="profile()!.avatarBase64"
                  alt="Avatar"
                  class="avatar-preview"
                />
                <button type="button" (click)="clearAvatar()">Quitar foto</button>
              }
            </div>

            <button type="submit" [disabled]="profileForm.invalid || isSaving()">
              Guardar cambios
            </button>
          </form>
        </div>
      }

      <!-- Sección PWA -->
      @if (pwaInstallService.canInstall()) {
        <div class="pwa-install">
          <button type="button" (click)="onInstallApp()">Instalar app</button>
        </div>
      }

      <!-- Sección Notificaciones -->
      <div class="notifications-section">
        <button type="button" (click)="onRequestNotification()">
          Activar notificaciones
          <span class="permission-status">
            @if (notificationService.permission() === 'granted') {
              (concedido)
            } @else if (notificationService.permission() === 'denied') {
              (denegado)
            } @else {
              (pendiente)
            }
          </span>
        </button>
      </div>

      @if (saveError()) {
        <p class="save-error">{{ saveError() }}</p>
      }
    </div>
  `,
})
export class ProfilePage implements OnInit {
  private readonly getUserProfileUseCase = inject(GetUserProfileUseCase);
  private readonly setUserProfileUseCase = inject(SetUserProfileUseCase);
  readonly pwaInstallService = inject(PwaInstallService);
  readonly notificationService = inject(NotificationPermissionService);

  private readonly fb = inject(FormBuilder);

  readonly profile = signal<Profile | null | undefined>(undefined);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);

  private avatarBase64: string | undefined;

  readonly profileForm = this.fb.group({
    name: ['', Validators.required],
    preferredUnit: ['kg'],
  });

  async ngOnInit(): Promise<void> {
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
}
