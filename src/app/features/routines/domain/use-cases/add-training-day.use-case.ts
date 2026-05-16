import { Injectable, inject } from '@angular/core';
import { TrainingDay } from '../training-day.entity';
import { TrainingDayRepository } from '../training-day.repository';
import { generateUUID } from '@core/shared/utils/uuid';

export interface AddTrainingDayInput {
  routineId: string;
  name: string;
  label?: string;
}

@Injectable()
export class AddTrainingDayUseCase {
  private readonly repo = inject(TrainingDayRepository);

  async execute(input: AddTrainingDayInput): Promise<TrainingDay> {
    const now = new Date();
    const day: TrainingDay = {
      id: generateUUID(),
      routineId: input.routineId,
      name: input.name,
      label: input.label,
      exercises: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.repo.save(day);
    return day;
  }
}
