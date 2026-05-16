import { TrainingDay } from './training-day.entity';

export abstract class TrainingDayRepository {
  abstract getById(id: string): Promise<TrainingDay | null>;
  abstract getByRoutineId(routineId: string): Promise<TrainingDay[]>;
  abstract save(day: TrainingDay): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
