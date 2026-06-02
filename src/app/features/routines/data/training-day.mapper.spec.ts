import { toTrainingDay, toTrainingDayRow, ExerciseInDayRow } from './training-day.mapper';
import { TrainingDay } from '../domain/training-day.entity';
import { TrainingDayRow } from '@core/db/database';
import { WeightRepsTarget, TimeTarget } from '../domain/target-set';

const NOW = new Date('2024-01-01T00:00:00Z');

function baseRow(overrides: Partial<TrainingDayRow> = {}): TrainingDayRow {
  return {
    id: 'day-1',
    routineId: 'routine-1',
    name: 'Day A',
    label: undefined,
    exercises: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function baseDay(overrides: Partial<TrainingDay> = {}): TrainingDay {
  return {
    id: 'day-1',
    routineId: 'routine-1',
    name: 'Day A',
    label: undefined,
    exercises: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('training-day.mapper', () => {

  // ─── toTrainingDay ───────────────────────────────────────────────────────────

  describe('toTrainingDay', () => {

    it('should map a row with empty exercises array', () => {
      const row = baseRow({ exercises: [] });
      const day = toTrainingDay(row);

      expect(day.id).toBe('day-1');
      expect(day.routineId).toBe('routine-1');
      expect(day.name).toBe('Day A');
      expect(day.exercises).toEqual([]);
    });

    it('should resolve exercises to empty array when row.exercises is null', () => {
      const row = baseRow({ exercises: null });
      const day = toTrainingDay(row);

      expect(day.exercises).toEqual([]);
    });

    it('should resolve exercises to empty array when row.exercises is undefined', () => {
      const row = baseRow({ exercises: undefined });
      const day = toTrainingDay(row);

      expect(day.exercises).toEqual([]);
    });

    it('should map exercises with targetSets', () => {
      const targetSet: WeightRepsTarget = { type: 'weight-reps', reps: 10, weightKg: 80 };
      const exercises: ExerciseInDayRow[] = [
        { exerciseId: 'ex-1', order: 0, targetSets: [targetSet] },
      ];
      const row = baseRow({ exercises });
      const day = toTrainingDay(row);

      expect(day.exercises).toHaveLength(1);
      expect(day.exercises[0].exerciseId).toBe('ex-1');
      expect(day.exercises[0].order).toBe(0);
      expect(day.exercises[0].targetSets).toHaveLength(1);
      expect(day.exercises[0].targetSets[0]).toEqual(targetSet);
    });

    it('should resolve targetSets to empty array when exercise.targetSets is undefined', () => {
      const exercises = [
        { exerciseId: 'ex-1', order: 0, targetSets: undefined as unknown as [] },
      ];
      const row = baseRow({ exercises });
      const day = toTrainingDay(row);

      expect(day.exercises[0].targetSets).toEqual([]);
    });

    it('should map optional restSeconds and note', () => {
      const exercises: ExerciseInDayRow[] = [
        { exerciseId: 'ex-1', order: 1, targetSets: [], restSeconds: 90, note: 'Focus on form' },
      ];
      const row = baseRow({ exercises });
      const day = toTrainingDay(row);

      expect(day.exercises[0].restSeconds).toBe(90);
      expect(day.exercises[0].note).toBe('Focus on form');
    });

    it('should map optional label', () => {
      const row = baseRow({ label: 'Push' });
      const day = toTrainingDay(row);

      expect(day.label).toBe('Push');
    });

    it('should preserve createdAt and updatedAt', () => {
      const row = baseRow();
      const day = toTrainingDay(row);

      expect(day.createdAt).toBe(NOW);
      expect(day.updatedAt).toBe(NOW);
    });
  });

  // ─── toTrainingDayRow ────────────────────────────────────────────────────────

  describe('toTrainingDayRow', () => {

    it('should serialize a day with no exercises', () => {
      const day = baseDay();
      const row = toTrainingDayRow(day);

      expect(row.id).toBe('day-1');
      expect(row.routineId).toBe('routine-1');
      expect(row.name).toBe('Day A');
      expect(row.exercises).toEqual([]);
    });

    it('should serialize exercises with targetSets', () => {
      const targetSet: WeightRepsTarget = { type: 'weight-reps', reps: 5, weightKg: 60 };
      const day = baseDay({
        exercises: [{ exerciseId: 'ex-2', order: 0, targetSets: [targetSet] }],
      });
      const row = toTrainingDayRow(day);
      const exRow = (row.exercises as ExerciseInDayRow[])[0];

      expect(exRow.exerciseId).toBe('ex-2');
      expect(exRow.targetSets).toHaveLength(1);
      expect(exRow.targetSets[0]).toEqual(targetSet);
    });

    it('should serialize optional restSeconds and note', () => {
      const day = baseDay({
        exercises: [{ exerciseId: 'ex-3', order: 0, targetSets: [], restSeconds: 60, note: 'slow' }],
      });
      const row = toTrainingDayRow(day);
      const exRow = (row.exercises as ExerciseInDayRow[])[0];

      expect(exRow.restSeconds).toBe(60);
      expect(exRow.note).toBe('slow');
    });
  });

  // ─── Round-trip ──────────────────────────────────────────────────────────────

  describe('round-trip (toTrainingDayRow → toTrainingDay)', () => {

    it('should round-trip a day with no exercises', () => {
      const day = baseDay();
      const result = toTrainingDay(toTrainingDayRow(day));

      expect(result.id).toBe(day.id);
      expect(result.routineId).toBe(day.routineId);
      expect(result.name).toBe(day.name);
      expect(result.exercises).toEqual([]);
    });

    it('should round-trip a day with exercises and targetSets', () => {
      const weightTarget: WeightRepsTarget = { type: 'weight-reps', reps: 8, weightKg: 90 };
      const timeTarget: TimeTarget = { type: 'time', durationSec: 45 };
      const day = baseDay({
        label: 'Upper',
        exercises: [
          {
            exerciseId: 'ex-1',
            order: 0,
            targetSets: [weightTarget, weightTarget],
            restSeconds: 120,
            note: 'Heavy day',
          },
          {
            exerciseId: 'ex-2',
            order: 1,
            targetSets: [timeTarget],
          },
        ],
      });

      const result = toTrainingDay(toTrainingDayRow(day));

      expect(result.label).toBe('Upper');
      expect(result.exercises).toHaveLength(2);

      const ex1 = result.exercises[0];
      expect(ex1.exerciseId).toBe('ex-1');
      expect(ex1.order).toBe(0);
      expect(ex1.targetSets).toHaveLength(2);
      expect(ex1.targetSets[0]).toEqual(weightTarget);
      expect(ex1.restSeconds).toBe(120);
      expect(ex1.note).toBe('Heavy day');

      const ex2 = result.exercises[1];
      expect(ex2.exerciseId).toBe('ex-2');
      expect(ex2.targetSets[0]).toEqual(timeTarget);
    });

    it('should round-trip optional fields as undefined when absent', () => {
      const day = baseDay({
        exercises: [{ exerciseId: 'ex-1', order: 0, targetSets: [] }],
      });
      const result = toTrainingDay(toTrainingDayRow(day));

      expect(result.label).toBeUndefined();
      expect(result.exercises[0].restSeconds).toBeUndefined();
      expect(result.exercises[0].note).toBeUndefined();
    });
  });
});
