import type { ForgeDatabase } from '@core/db/database';

const d = (n: number): Date => new Date(Date.now() - n * 86_400_000);
const isoDate = (date: Date): string => date.toISOString().slice(0, 10);

export async function seedDemoData(db: ForgeDatabase): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.profile,
      db.exercises,
      db.routines,
      db.trainingDays,
      db.sessions,
      db.workedSets,
      db.personalRecords,
    ],
    () =>
      db.profile
        .bulkPut([
          {
            id: 'me',
            name: 'Luca',
            preferredUnit: 'kg',
            createdAt: d(60),
            updatedAt: d(0),
          },
        ])
        .then(() =>
          db.exercises.bulkPut([
            {
              id: 'ex-bench',
              name: 'Press de banca',
              muscleGroup: 'chest',
              equipment: 'barbell',
              trackingType: 'weight-reps',
              isCustom: false,
              createdAt: d(60),
              updatedAt: d(60),
            },
            {
              id: 'ex-ohp',
              name: 'Press militar',
              muscleGroup: 'shoulders',
              equipment: 'barbell',
              trackingType: 'weight-reps',
              isCustom: false,
              createdAt: d(60),
              updatedAt: d(60),
            },
            {
              id: 'ex-row',
              name: 'Remo con barra',
              muscleGroup: 'back',
              equipment: 'barbell',
              trackingType: 'weight-reps',
              isCustom: false,
              createdAt: d(60),
              updatedAt: d(60),
            },
            {
              id: 'ex-squat',
              name: 'Sentadilla',
              muscleGroup: 'legs',
              equipment: 'barbell',
              trackingType: 'weight-reps',
              isCustom: false,
              createdAt: d(60),
              updatedAt: d(60),
            },
            {
              id: 'ex-pullup',
              name: 'Dominadas',
              muscleGroup: 'back',
              equipment: 'bodyweight',
              trackingType: 'bodyweight-reps',
              isCustom: false,
              createdAt: d(60),
              updatedAt: d(60),
            },
          ]),
        )
        .then(() =>
          db.routines.bulkPut([
            {
              id: 'r-1',
              name: 'Full Body 3x semana',
              description: 'Rutina principal',
              isActive: true,
              schedule: {
                monday: 'd-push',
                wednesday: 'd-pull',
                friday: 'd-push',
              },
              createdAt: d(40),
              updatedAt: d(2),
            },
          ]),
        )
        .then(() =>
          db.trainingDays.bulkPut([
            {
              id: 'd-push',
              routineId: 'r-1',
              name: 'Empuje',
              label: 'A',
              exercises: [
                {
                  exerciseId: 'ex-bench',
                  order: 0,
                  targetSets: [
                    { type: 'weight-reps', reps: 8, weightKg: 60 },
                    { type: 'weight-reps', reps: 8, weightKg: 60 },
                    { type: 'weight-reps', reps: 6, weightKg: 65 },
                  ],
                  restSeconds: 120,
                },
                {
                  exerciseId: 'ex-ohp',
                  order: 1,
                  targetSets: [
                    { type: 'weight-reps', reps: 10, weightKg: 35 },
                    { type: 'weight-reps', reps: 10, weightKg: 35 },
                  ],
                  restSeconds: 90,
                },
              ],
              createdAt: d(40),
              updatedAt: d(40),
            },
            {
              id: 'd-pull',
              routineId: 'r-1',
              name: 'Tiron y pierna',
              label: 'B',
              exercises: [
                {
                  exerciseId: 'ex-row',
                  order: 0,
                  targetSets: [
                    { type: 'weight-reps', reps: 10, weightKg: 50 },
                    { type: 'weight-reps', reps: 10, weightKg: 50 },
                  ],
                  restSeconds: 120,
                },
                {
                  exerciseId: 'ex-pullup',
                  order: 1,
                  targetSets: [
                    { type: 'bodyweight-reps', reps: 8 },
                    { type: 'bodyweight-reps', reps: 6 },
                  ],
                  restSeconds: 120,
                },
                {
                  exerciseId: 'ex-squat',
                  order: 2,
                  targetSets: [
                    { type: 'weight-reps', reps: 8, weightKg: 80 },
                    { type: 'weight-reps', reps: 8, weightKg: 80 },
                  ],
                  restSeconds: 150,
                },
              ],
              createdAt: d(40),
              updatedAt: d(40),
            },
          ]),
        )
        .then(() =>
          db.sessions.bulkPut([
            {
              id: 's-1',
              routineId: 'r-1',
              dayId: 'd-push',
              date: isoDate(d(5)),
              startedAt: d(5),
              endedAt: d(5),
              status: 'completed',
              createdAt: d(5),
              updatedAt: d(5),
            },
            {
              id: 's-2',
              routineId: 'r-1',
              dayId: 'd-pull',
              date: isoDate(d(3)),
              startedAt: d(3),
              endedAt: d(3),
              status: 'completed',
              createdAt: d(3),
              updatedAt: d(3),
            },
          ]),
        )
        .then(() =>
          db.workedSets.bulkPut([
            {
              id: 'ws-1',
              sessionId: 's-1',
              exerciseId: 'ex-bench',
              type: 'weight-reps',
              isPR: true,
              reps: 8,
              weightKg: 60,
              createdAt: d(5),
            },
            {
              id: 'ws-2',
              sessionId: 's-1',
              exerciseId: 'ex-bench',
              type: 'weight-reps',
              isPR: false,
              reps: 8,
              weightKg: 60,
              createdAt: d(5),
            },
            {
              id: 'ws-3',
              sessionId: 's-1',
              exerciseId: 'ex-ohp',
              type: 'weight-reps',
              isPR: true,
              reps: 10,
              weightKg: 35,
              createdAt: d(5),
            },
            {
              id: 'ws-4',
              sessionId: 's-2',
              exerciseId: 'ex-row',
              type: 'weight-reps',
              isPR: true,
              reps: 10,
              weightKg: 50,
              createdAt: d(3),
            },
            {
              id: 'ws-5',
              sessionId: 's-2',
              exerciseId: 'ex-pullup',
              type: 'bodyweight-reps',
              isPR: true,
              reps: 8,
              createdAt: d(3),
            },
            {
              id: 'ws-6',
              sessionId: 's-2',
              exerciseId: 'ex-squat',
              type: 'weight-reps',
              isPR: true,
              reps: 8,
              weightKg: 80,
              createdAt: d(3),
            },
          ]),
        )
        .then(() =>
          db.personalRecords.bulkPut([
            {
              id: 'pr-1',
              exerciseId: 'ex-bench',
              trackingType: 'weight-reps',
              workedSetId: 'ws-1',
              achievedAt: d(5),
              reps: 8,
              weightKg: 60,
              createdAt: d(5),
              updatedAt: d(5),
            },
            {
              id: 'pr-2',
              exerciseId: 'ex-ohp',
              trackingType: 'weight-reps',
              workedSetId: 'ws-3',
              achievedAt: d(5),
              reps: 10,
              weightKg: 35,
              createdAt: d(5),
              updatedAt: d(5),
            },
            {
              id: 'pr-3',
              exerciseId: 'ex-row',
              trackingType: 'weight-reps',
              workedSetId: 'ws-4',
              achievedAt: d(3),
              reps: 10,
              weightKg: 50,
              createdAt: d(3),
              updatedAt: d(3),
            },
            {
              id: 'pr-4',
              exerciseId: 'ex-pullup',
              trackingType: 'bodyweight-reps',
              workedSetId: 'ws-5',
              achievedAt: d(3),
              reps: 8,
              createdAt: d(3),
              updatedAt: d(3),
            },
            {
              id: 'pr-5',
              exerciseId: 'ex-squat',
              trackingType: 'weight-reps',
              workedSetId: 'ws-6',
              achievedAt: d(3),
              reps: 8,
              weightKg: 80,
              createdAt: d(3),
              updatedAt: d(3),
            },
          ]),
        ),
  );
}
