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
  schedule: WeeklyScheduleRow | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Serialized shape of WeeklySchedule for DB storage. Each value is a TrainingDay.id. */
export interface WeeklyScheduleRow {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

/**
 * PersonalRecordRow — flat denormalized record for a PR.
 * Denormalized value fields match WorkedSetRow field names to enable mapper reuse.
 * D-7, ADR-14.
 */
export interface PersonalRecordRow {
  id: string;
  exerciseId: string;
  trackingType: string;
  workedSetId: string;
  achievedAt: Date;
  // Denormalized WorkedSet fields (match WorkedSetRow field names, D-7/R2)
  reps?: number;
  weightKg?: number;
  extraWeightKg?: number;
  durationSec?: number;
  distanceKm?: number;
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
  personalRecords!: Table<PersonalRecordRow, string>;

  constructor() {
    super('forge');

    // v1 — original schema (keep intact for upgrade chain, ADR-14/D-8/R3)
    this.version(1).stores({
      profile: 'id',
      routines: 'id, isActive',
      trainingDays: 'id, routineId',
      exercises: 'id, muscleGroup, isCustom, name',
      sessions: 'id, date, routineId, dayId, status',
      workedSets: 'id, sessionId, exerciseId',
    });

    // v2 — additive-only: new personalRecords table + isPR index on workedSets.
    // No .upgrade() callback needed (single-user install, no existing PR data). D-8.
    this.version(2).stores({
      workedSets: 'id, sessionId, exerciseId, isPR',
      personalRecords: 'id, exerciseId, trackingType, achievedAt',
    });
  }
}
