import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Routine } from '../../domain/routine.entity';

@Component({
  selector: 'fg-routine-card',
  standalone: true,
  template: `
    <div
      [class]="'border rounded p-3' + (routine.isActive ? ' border-accent-500 bg-accent-500/10' : '')"
    >
      <div class="flex items-center justify-between">
        <div>
          <span class="font-medium">{{ routine.name }}</span>
          @if (routine.isActive) {
            <span class="ml-2 text-xs bg-accent-500 text-forge-50 px-2 py-0.5 rounded-full">
              Activa
            </span>
          }
          @if (routine.description) {
            <p class="text-sm text-forge-400 mt-0.5">{{ routine.description }}</p>
          }
        </div>
        <div class="flex gap-2">
          @if (!routine.isActive) {
            <button
              class="text-sm text-accent-500"
              (click)="activate.emit(routine)"
            >
              Activar
            </button>
          }
          <button
            class="text-sm text-forge-300"
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
