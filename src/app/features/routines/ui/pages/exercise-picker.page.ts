import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercise } from '@features/exercises/domain/exercise.entity';
import { GetExercisesUseCase } from '@features/exercises/domain/use-cases/get-exercises.use-case';

import { AddExerciseToDayUseCase } from '../../domain/use-cases/add-exercise-to-day.use-case';

@Component({
  selector: 'fg-exercise-picker-page',
  standalone: true,
  providers: [GetExercisesUseCase, AddExerciseToDayUseCase],
  template: `
    <div class="p-4">
      <div class="flex items-center gap-2 mb-4">
        <button class="text-gray-600" (click)="back()">← Volver</button>
        <h1 class="text-xl font-bold">Elegir ejercicio</h1>
      </div>

      <input
        class="w-full border rounded p-2 mb-4"
        placeholder="Buscar ejercicio..."
        [value]="searchQuery()"
        (input)="onSearchInput($event)"
      />

      @if (exercises().length === 0) {
        <p class="text-gray-500 text-center mt-8">No se encontraron ejercicios.</p>
      }

      <ul class="space-y-2">
        @for (exercise of exercises(); track exercise.id) {
          <li
            class="border rounded p-3 cursor-pointer hover:bg-gray-50"
            tabindex="0"
            role="button"
            (click)="pickExercise(exercise)"
            (keydown.enter)="pickExercise(exercise)"
          >
            <div class="font-medium">{{ exercise.name }}</div>
            <div class="text-sm text-gray-500">{{ exercise.muscleGroup }}</div>
          </li>
        }
      </ul>
    </div>
  `,
})
export class ExercisePickerPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getExercises = inject(GetExercisesUseCase);
  private readonly addExerciseToDay = inject(AddExerciseToDayUseCase);

  exercises = signal<Exercise[]>([]);
  searchQuery = signal('');
  routineId = signal('');
  dayId = signal('');

  constructor() {
    effect(() => {
      const query = this.searchQuery();
      void this.loadExercises(query);
    });
  }

  ngOnInit(): void {
    this.routineId.set(this.route.snapshot.paramMap.get('routineId') ?? '');
    this.dayId.set(this.route.snapshot.paramMap.get('dayId') ?? '');
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  async loadExercises(search: string): Promise<void> {
    const filter = search.trim() ? { search: search.trim() } : undefined;
    this.exercises.set(await this.getExercises.execute(filter));
  }

  async pickExercise(exercise: Exercise): Promise<void> {
    await this.addExerciseToDay.execute({
      dayId: this.dayId(),
      exerciseId: exercise.id,
    });
    void this.router.navigate([
      '/routines',
      this.routineId(),
      'days',
      this.dayId(),
    ]);
  }

  back(): void {
    void this.router.navigate([
      '/routines',
      this.routineId(),
      'days',
      this.dayId(),
    ]);
  }
}
