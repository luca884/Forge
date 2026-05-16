import { Injectable, inject } from '@angular/core';
import { TrainingDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';

export interface EditTrainingDayInput {
  id: string;
  name: string;
  label?: string;
}

@Injectable()
export class EditTrainingDayUseCase {
  private readonly repo = inject(TrainingDayRepository);

  async execute(input: EditTrainingDayInput): Promise<TrainingDay> {
    const existing = await this.repo.getById(input.id);
    if (!existing) {
      throw new Error(`TrainingDay not found: ${input.id}`);
    }

    const updated: TrainingDay = {
      ...existing,
      name: input.name,
      label: input.label,
      updatedAt: new Date(),
    };

    await this.repo.save(updated);
    return updated;
  }
}
