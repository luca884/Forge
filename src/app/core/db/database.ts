import Dexie, { type Table } from 'dexie';

// Row shapes — minimal DB-layer types only.
// Domain entities live in each feature's domain/; mappers in data/ translate.
export interface ProfileRow {
  id: 'me';
  name: string;
  avatarBase64?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoutineRow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  schedule: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingDayRow {
  id: string;
  routineId: string;
  name: string;
  label?: string;
  exercises: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseRow {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  trackingType: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRow {
  id: string;
  routineId: string;
  dayId: string;
  date: string;
  startedAt: Date;
  endedAt?: Date;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkedSetRow {
  id: string;
  sessionId: string;
  exerciseId: string;
  type: string;
  isPR: boolean;
  createdAt: Date;
  targetSetIndex?: number;
  note?: string;
  // weight-reps fields
  reps?: number;
  weightKg?: number;
  // bodyweight-reps fields
  extraWeightKg?: number;
  // time fields
  durationSec?: number;
  // distance-time fields
  distanceKm?: number;
}

export class ForgeDatabase extends Dexie {
  profile!: Table<ProfileRow, string>;
  routines!: Table<RoutineRow, string>;
  trainingDays!: Table<TrainingDayRow, string>;
  exercises!: Table<ExerciseRow, string>;
  sessions!: Table<SessionRow, string>;
  workedSets!: Table<WorkedSetRow, string>;

  constructor() {
    super('forge');
    this.version(1).stores({
      profile: 'id',
      routines: 'id, isActive',
      trainingDays: 'id, routineId',
      exercises: 'id, muscleGroup, isCustom, name',
      sessions: 'id, date, routineId, dayId, status',
      workedSets: 'id, sessionId, exerciseId',
    });
  }
}
