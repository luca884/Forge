import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Routine } from '../../domain/routine.entity';
import { GetAllRoutinesUseCase } from '../../domain/use-cases/get-all-routines.use-case';
import { SetActiveRoutineUseCase } from '../../domain/use-cases/set-active-routine.use-case';

@Component({
  selector: 'fg-routine-list-page',
  standalone: true,
  providers: [GetAllRoutinesUseCase, SetActiveRoutineUseCase],
  template: `
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold">Rutinas</h1>
        <button
          class="bg-accent-500 text-forge-50 px-4 py-2 rounded"
          (click)="createRoutine()"
        >
          Nueva rutina
        </button>
      </div>

      @if (routines().length === 0) {
        <p class="text-forge-400 text-center mt-8">No tenés rutinas todavía.</p>
      }

      <ul class="space-y-2">
        @for (routine of routines(); track routine.id) {
          <li
            [class]="'border rounded p-3 flex items-center justify-between' + (routine.isActive ? ' border-accent-500 bg-accent-500/10' : '')"
          >
            <div>
              <span class="font-medium">{{ routine.name }}</span>
              @if (routine.isActive) {
                <span class="ml-2 text-xs bg-accent-500 text-forge-50 px-2 py-0.5 rounded-full">Activa</span>
              }
              @if (routine.description) {
                <p class="text-sm text-forge-400">{{ routine.description }}</p>
              }
            </div>
            <div class="flex gap-2">
              @if (!routine.isActive) {
                <button
                  class="text-sm text-accent-500"
                  (click)="setActive(routine)"
                >
                  Activar
                </button>
              }
              <button
                class="text-sm text-forge-300"
                (click)="editRoutine(routine)"
              >
                Editar
              </button>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class RoutineListPage implements OnInit {
  private readonly getAllRoutines = inject(GetAllRoutinesUseCase);
  private readonly setActiveRoutineUseCase = inject(SetActiveRoutineUseCase);
  private readonly router = inject(Router);

  routines = signal<Routine[]>([]);

  ngOnInit(): void {
    void this.loadRoutines();
  }

  async loadRoutines(): Promise<void> {
    this.routines.set(await this.getAllRoutines.execute());
  }

  createRoutine(): void {
    void this.router.navigate(['/routines/new']);
  }

  editRoutine(routine: Routine): void {
    void this.router.navigate(['/routines', routine.id]);
  }

  async setActive(routine: Routine): Promise<void> {
    await this.setActiveRoutineUseCase.execute(routine.id);
    await this.loadRoutines();
  }
}
