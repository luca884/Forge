import { Injectable, inject } from '@angular/core';
import { Routine } from '../routine.entity';
import { RoutineRepository } from '../routine.repository';

@Injectable()
export class GetAllRoutinesUseCase {
  private readonly repo = inject(RoutineRepository);

  execute(): Promise<Routine[]> {
    return this.repo.getAll();
  }
}
