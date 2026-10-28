import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FgCardComponent, FgIconComponent } from '@core/shared/ui';
import { UserPreferencesService } from '@core/profile/user-preferences.service';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import { AddExercisesToDayUseCase } from '@features/routines/domain/use-cases/add-exercises-to-day.use-case';
import { AddTrainingDayUseCase } from '@features/routines/domain/use-cases/add-training-day.use-case';
import { CreateRoutineUseCase } from '@features/routines/domain/use-cases/create-routine.use-case';
import { SetTargetSetsUseCase } from '@features/routines/domain/use-cases/set-target-sets.use-case';
import { RoutineTemplate } from '../../domain/routine-template';
import { ROUTINE_TEMPLATES } from '../../domain/routine-templates';
import { ApplyRoutineTemplateUseCase } from '../../domain/use-cases/apply-routine-template.use-case';

/**
 * "Primer uso" (C-Welcome): what Hoy shows when the user has no routine at all (S8).
 *
 * The three steps, the starter templates and the two ways out (create from scratch, browse the
 * library). Applying a template only adds a routine (L29); the host reloads itself on `applied`.
 *
 * The use cases are provided here; the repositories they inject (routines, training days,
 * exercises) come from the host route, as with every other screen of the app.
 */
@Component({
  selector: 'fg-first-use',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, FgCardComponent, FgIconComponent],
  providers: [
    ApplyRoutineTemplateUseCase,
    CreateRoutineUseCase,
    AddTrainingDayUseCase,
    AddExercisesToDayUseCase,
    SetTargetSetsUseCase,
    SeedExercisesUseCase,
  ],
  host: { class: 'flex flex-col gap-[18px]' },
  template: `
    <!-- 3 PASOS -->
    <fg-card [padding]="0">
      <section aria-labelledby="first-use-steps-title">
        <div class="flex flex-col gap-0.5 px-4 pt-3.5 pb-2">
          <h2 id="first-use-steps-title" class="text-xl leading-[26px] font-semibold tracking-[-0.02em] text-ink">Empezá en 3 pasos</h2>
          <span class="text-[13px] leading-[18px] text-ink-2">Te lleva menos de dos minutos.</span>
        </div>
        <ol class="list-none m-0 p-0">
          <li class="flex items-start gap-3 px-4 py-3 border-t border-line-soft">
            <span class="flex items-center justify-center w-[26px] h-[26px] flex-none rounded-full bg-ink text-page">
              <fg-icon name="check" [size]="14" [strokeWidth]="3" />
            </span>
            <span class="flex flex-col gap-px">
              <span class="text-[15px] leading-5 font-medium text-ink-2">Elegí tu unidad</span>
              <span class="font-mono text-xs leading-4 text-ink-2">{{ userPrefs.unit() }} · listo</span>
            </span>
          </li>
          <li class="flex items-start gap-3 px-4 py-3 border-t border-line-soft bg-accent-soft">
            <span class="flex items-center justify-center w-[26px] h-[26px] flex-none rounded-full bg-accent text-accent-on font-mono text-[13px] font-medium">2</span>
            <span class="flex flex-col gap-px">
              <span class="text-[15px] leading-5 font-semibold text-ink">Armá tu rutina</span>
              <span class="text-[13px] leading-[18px] text-ink-2">Usá una plantilla o creala desde cero.</span>
            </span>
          </li>
          <li class="flex items-start gap-3 px-4 py-3 border-t border-line-soft">
            <span class="flex items-center justify-center w-[26px] h-[26px] flex-none box-border rounded-full border-[1.5px] border-dash text-ink-2 font-mono text-[13px]">3</span>
            <span class="flex flex-col gap-px">
              <span class="text-[15px] leading-5 font-medium text-ink">Asigná días a tu semana</span>
              <span class="text-[13px] leading-[18px] text-ink-2">Así Forge te dice qué toca cada día.</span>
            </span>
          </li>
        </ol>
      </section>
    </fg-card>

    <!-- PLANTILLAS -->
    <section aria-labelledby="first-use-templates-title" class="flex flex-col gap-1.5">
      <h2 id="first-use-templates-title" class="text-[11px] leading-[14px] font-semibold tracking-[0.08em] uppercase text-ink-2">Plantillas</h2>
      <fg-card [padding]="0">
        <ul class="list-none m-0 p-0">
          @for (template of templates; track template.id; let last = $last) {
            <li
              data-template-row
              class="flex items-center justify-between gap-2 min-h-[60px] pl-4 pr-2.5"
              [class.border-b]="!last"
              [class.border-line-soft]="!last"
            >
              <span class="flex flex-col min-w-0">
                <span class="text-[15px] leading-5 font-medium text-ink">{{ template.name }}</span>
                <span class="font-mono text-xs leading-4 text-ink-2">{{ template.summary }}</span>
              </span>
              <button
                type="button"
                class="h-9 px-3.5 flex-none rounded-md border border-accent text-accent-ink text-[13px] font-semibold disabled:opacity-45"
                [disabled]="applying()"
                [attr.aria-label]="'Usar plantilla ' + template.name"
                (click)="use(template)"
              >Usar</button>
            </li>
          }
        </ul>
      </fg-card>
    </section>

    @if (errorMessage()) {
      <p class="text-danger" role="alert">{{ errorMessage() }}</p>
    }

    <a
      routerLink="/routines/new"
      class="flex items-center justify-center gap-1.5 h-12 rounded-[10px] border border-dashed border-dash text-ink text-[15px] font-medium"
    >
      <fg-icon name="plus" [size]="16" [strokeWidth]="2" />
      Crear rutina desde cero
    </a>

    <a routerLink="/exercises" class="self-center p-2 text-[13px] font-medium text-accent-ink">Ver la biblioteca de ejercicios</a>
  `,
})
export class FgFirstUseComponent implements OnInit {
  protected readonly userPrefs = inject(UserPreferencesService);
  private readonly applyTemplate = inject(ApplyRoutineTemplateUseCase);

  /** Emitted once a template became a routine, so the host can show it. */
  readonly applied = output<void>();

  protected readonly templates: readonly RoutineTemplate[] = ROUTINE_TEMPLATES;
  protected readonly applying = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    // Step 1 shows the saved unit; the service loads it once and is a no-op afterwards.
    void this.userPrefs.loadOnce();
  }

  protected async use(template: RoutineTemplate): Promise<void> {
    if (this.applying()) return;
    this.applying.set(true);
    this.errorMessage.set(null);
    try {
      await this.applyTemplate.execute(template.id);
      this.applied.emit();
    } catch {
      this.errorMessage.set('No se pudo crear la rutina. Intentá de nuevo.');
    } finally {
      this.applying.set(false);
    }
  }
}
