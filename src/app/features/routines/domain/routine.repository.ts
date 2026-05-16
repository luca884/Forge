import { Routine } from './routine.entity';

export abstract class RoutineRepository {
  abstract getAll(): Promise<Routine[]>;
  abstract getActive(): Promise<Routine | null>;
  abstract getById(id: string): Promise<Routine | null>;
  abstract save(routine: Routine): Promise<void>;
  abstract setActive(id: string): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
