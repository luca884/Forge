import { Injectable, inject } from '@angular/core';
import { RoutineRepository } from '../routine.repository';

@Injectable()
export class SetActiveRoutineUseCase {
  private readonly repo = inject(RoutineRepository);

  execute(id: string): Promise<void> {
    return this.repo.setActive(id);
  }
}
