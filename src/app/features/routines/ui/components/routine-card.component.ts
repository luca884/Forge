import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Routine } from '../../domain/routine.entity';

@Component({
  selector: 'fg-routine-card',
  standalone: true,
  template: `
    <div
      class="border rounded p-3"
      [class.border-blue-500]="routine.isActive"
      [class.bg-blue-50]="routine.isActive"
    >
      <div class="flex items-center justify-between">
        <div>
          <span class="font-medium">{{ routine.name }}</span>
          @if (routine.isActive) {
            <span class="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              Activa
            </span>
          }
          @if (routine.description) {
            <p class="text-sm text-gray-500 mt-0.5">{{ routine.description }}</p>
          }
        </div>
        <div class="flex gap-2">
          @if (!routine.isActive) {
            <button
              class="text-sm text-blue-600"
              (click)="activate.emit(routine)"
            >
              Activar
            </button>
          }
          <button
            class="text-sm text-gray-600"
            (click)="edit.emit(routine)"
          >
            Editar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class RoutineCardComponent {
  @Input({ required: true }) routine!: Routine;
  @Output() edit = new EventEmitter<Routine>();
  @Output() activate = new EventEmitter<Routine>();
}
