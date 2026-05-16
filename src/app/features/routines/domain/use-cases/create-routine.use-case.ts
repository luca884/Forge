import { Injectable, inject } from '@angular/core';
import { Routine } from '../routine.entity';
import { RoutineRepository } from '../routine.repository';
import { generateUUID } from '@core/shared/utils/uuid';

export interface CreateRoutineInput {
  name: string;
  description?: string;
}

@Injectable()
export class CreateRoutineUseCase {
  private readonly repo = inject(RoutineRepository);

  async execute(input: CreateRoutineInput): Promise<Routine> {
    const activeRoutine = await this.repo.getActive();
    const now = new Date();

    const routine: Routine = {
      id: generateUUID(),
      name: input.name,
      description: input.description,
      isActive: activeRoutine === null,
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.save(routine);
    return routine;
  }
}
