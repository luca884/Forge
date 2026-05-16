import { Injectable, inject } from '@angular/core';
import { Routine } from '../routine.entity';
import { RoutineRepository } from '../routine.repository';

@Injectable()
export class GetActiveRoutineUseCase {
  private readonly repo = inject(RoutineRepository);

  execute(): Promise<Routine | null> {
    return this.repo.getActive();
  }
}
