import { Injectable, inject } from '@angular/core';
import { Routine } from '../routine.entity';
import { RoutineRepository } from '../routine.repository';

export interface EditRoutineInput {
  id: string;
  name: string;
  description?: string;
}

@Injectable()
export class EditRoutineUseCase {
  private readonly repo = inject(RoutineRepository);

  async execute(input: EditRoutineInput): Promise<Routine> {
    const existing = await this.repo.getById(input.id);
    if (!existing) {
      throw new Error(`Routine not found: ${input.id}`);
    }

    const updated: Routine = {
      ...existing,
      name: input.name,
      description: input.description,
      updatedAt: new Date(),
    };

    await this.repo.save(updated);
    return updated;
  }
}
