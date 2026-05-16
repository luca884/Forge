import { Injectable, inject } from '@angular/core';
import { WorkedSet } from '../worked-set';
import { SessionRepository } from '../session.repository';

@Injectable()
export class GetLastWorkedSetForExerciseUseCase {
  private readonly sessionRepo = inject(SessionRepository);

  execute(exerciseId: string): Promise<WorkedSet | null> {
    return this.sessionRepo.getLastWorkedSetForExercise(exerciseId);
  }
}
