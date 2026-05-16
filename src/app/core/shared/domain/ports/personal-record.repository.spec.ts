import { PersonalRecordRepository } from './personal-record.repository';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { TrackingType } from '@core/shared/domain/tracking-type';

// Type-smoke spec: verifies the abstract class contract without an implementation.
// V-52, V-53, D-9.

describe('PersonalRecordRepository port', () => {
  // Build a minimal spy implementation to verify abstract method presence
  class SpyPersonalRecordRepository extends PersonalRecordRepository {
    savedRecords: PersonalRecord[] = [];

    override async save(record: PersonalRecord): Promise<void> {
      this.savedRecords.push(record);
    }

    override async getById(id: string): Promise<PersonalRecord | null> {
      return this.savedRecords.find((r) => r.id === id) ?? null;
    }

    override async getCurrentForExercise(
      exerciseId: string,
      trackingType: TrackingType,
    ): Promise<PersonalRecord | null> {
      const matches = this.savedRecords.filter(
        (r) => r.exerciseId === exerciseId && r.trackingType === trackingType,
      );
      return matches[matches.length - 1] ?? null;
    }

    override async listAll(exerciseId?: string): Promise<PersonalRecord[]> {
      if (exerciseId !== undefined) {
        return this.savedRecords.filter((r) => r.exerciseId === exerciseId);
      }
      return [...this.savedRecords];
    }
  }

  let repo: SpyPersonalRecordRepository;

  beforeEach(() => {
    repo = new SpyPersonalRecordRepository();
  });

  it('can be instantiated as a concrete subclass (abstract class contract)', () => {
    // V-52: abstract class instanciable vía spy
    expect(repo).toBeInstanceOf(PersonalRecordRepository);
  });

  it('exposes abstract method: save', () => {
    // V-52: abstract methods present
    expect(typeof repo.save).toBe('function');
  });

  it('exposes abstract method: getById', () => {
    expect(typeof repo.getById).toBe('function');
  });

  it('exposes abstract method: getCurrentForExercise', () => {
    expect(typeof repo.getCurrentForExercise).toBe('function');
  });

  it('exposes abstract method: listAll', () => {
    expect(typeof repo.listAll).toBe('function');
  });

  it('does NOT have an update method — append-only invariant', () => {
    // V-53: no update or delete on this port (CC-16)
    expect((repo as any).update).toBeUndefined();
  });

  it('does NOT have a delete method — append-only invariant', () => {
    // V-53: CC-16
    expect((repo as any).delete).toBeUndefined();
  });

  it('getById returns null for non-existent id', async () => {
    const result = await repo.getById('non-existent');
    expect(result).toBeNull();
  });

  it('listAll returns all saved records', async () => {
    const record: PersonalRecord = {
      id: 'pr-1',
      exerciseId: 'ex-1',
      trackingType: 'weight-reps',
      workedSetId: 'ws-1',
      achievedAt: new Date(),
      set: {
        id: 'ws-1',
        sessionId: 'session-1',
        exerciseId: 'ex-1',
        type: 'weight-reps',
        reps: { value: 5 } as any,
        weight: { value: 100 } as any,
        isPR: true,
        createdAt: new Date(),
      } as any,
    };
    await repo.save(record);
    const all = await repo.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.id).toBe('pr-1');
  });
});
