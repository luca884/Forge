/**
 * dexie-personal-record.repository.ts
 * Adapter implementing PersonalRecordRepository using the Dexie `personalRecords` table.
 *
 * Append-only: uses `.add()` (not `.put()`) to enforce the invariant that each call
 * inserts a new row with a unique id. CC-16, D-10/R3, ADR-12.
 *
 * getCurrentForExercise selects the MAX-metric row client-side:
 *   weight-reps → max weightKg
 *   bodyweight-reps → max reps (or extraWeightKg as tiebreaker)
 *   time → min durationSec (shorter = better)
 *   distance-time → max distanceKm
 * D-9/R3, D-10/R4, task 1.4.3.
 *
 * Dexie boolean indices are unreliable in fake-indexeddb — all filters client-side.
 */
import { Injectable, inject } from '@angular/core';
import { ForgeDatabaseService } from '@core/db/forge-database.service';
import { PersonalRecordRow } from '@core/db/database';
import { TrackingType } from '@core/shared/domain/tracking-type';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';
import { toPersonalRecord, toPersonalRecordRow } from '../mappers/personal-record.mapper';

@Injectable()
export class DexiePersonalRecordRepository extends PersonalRecordRepository {
  private readonly db = inject(ForgeDatabaseService);

  /** Append-only insert. Never overwrites existing rows. D-10/R3, CC-16. */
  async save(record: PersonalRecord): Promise<void> {
    await this.db.personalRecords.add(toPersonalRecordRow(record));
  }

  async getById(id: string): Promise<PersonalRecord | null> {
    const row = await this.db.personalRecords.get(id);
    return row ? toPersonalRecord(row) : null;
  }

  /**
   * Returns the PersonalRecord with the highest relevant metric for the given
   * exerciseId and trackingType.
   *
   * Client-side filtering + sorting to avoid Dexie compound-index limitations
   * (consistent with slice-1 patterns established for fake-indexeddb). D-10/R4.
   */
  async getCurrentForExercise(
    exerciseId: string,
    trackingType: TrackingType,
  ): Promise<PersonalRecord | null> {
    const rows = await this.db.personalRecords
      .where('exerciseId')
      .equals(exerciseId)
      .toArray();

    const filtered = rows.filter((r) => r.trackingType === trackingType);
    if (filtered.length === 0) return null;

    const best = this.selectBestRow(filtered, trackingType);
    return best ? toPersonalRecord(best) : null;
  }

  /** Returns true if at least one PR exists for the given exerciseId. P3-2. */
  async existsByExerciseId(exerciseId: string): Promise<boolean> {
    return (await this.db.personalRecords.where('exerciseId').equals(exerciseId).count()) > 0;
  }

  /** Removes all PR rows whose workedSetId is in the given set. No-op if empty. */
  async deleteByWorkedSetIds(workedSetIds: ReadonlySet<string>): Promise<void> {
    if (workedSetIds.size === 0) return;
    const rows = await this.db.personalRecords.toArray();
    const idsToDelete = rows
      .filter(r => workedSetIds.has(r.workedSetId))
      .map(r => r.id);
    if (idsToDelete.length > 0) {
      await this.db.personalRecords.bulkDelete(idsToDelete);
    }
  }

  /**
   * Returns all PersonalRecord rows, optionally filtered by exerciseId,
   * ordered by achievedAt descending. D-9/R4, D-10/R5.
   */
  async listAll(exerciseId?: string): Promise<PersonalRecord[]> {
    let rows: PersonalRecordRow[];

    if (exerciseId !== undefined) {
      rows = await this.db.personalRecords
        .where('exerciseId')
        .equals(exerciseId)
        .toArray();
    } else {
      rows = await this.db.personalRecords.toArray();
    }

    // Order by achievedAt descending (most recent PR first).
    // Coerce to Date because fake-indexeddb may return Date fields as strings.
    rows.sort(
      (a, b) =>
        new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime(),
    );

    return rows.map(toPersonalRecord);
  }

  // ─── private helpers ──────────────────────────────────────────────────────────

  /**
   * Select the best row from a pre-filtered array based on the MAX-metric
   * rule for each trackingType. D-9/R3, task 1.4.3.
   */
  private selectBestRow(
    rows: PersonalRecordRow[],
    trackingType: TrackingType,
  ): PersonalRecordRow | null {
    if (rows.length === 0) return null;

    switch (trackingType) {
      case 'weight-reps':
        // MAX weightKg
        return rows.reduce((best, row) =>
          (row.weightKg ?? 0) > (best.weightKg ?? 0) ? row : best,
        );

      case 'bodyweight-reps':
        // MAX reps (extraWeightKg as tiebreaker)
        return rows.reduce((best, row) => {
          const rowReps = row.reps ?? 0;
          const bestReps = best.reps ?? 0;
          if (rowReps !== bestReps) return rowReps > bestReps ? row : best;
          return (row.extraWeightKg ?? 0) > (best.extraWeightKg ?? 0) ? row : best;
        });

      case 'time':
        // MIN durationSec (shorter time = better)
        return rows.reduce((best, row) =>
          (row.durationSec ?? Infinity) < (best.durationSec ?? Infinity) ? row : best,
        );

      case 'distance-time':
        // MAX distanceKm
        return rows.reduce((best, row) =>
          (row.distanceKm ?? 0) > (best.distanceKm ?? 0) ? row : best,
        );
    }
  }
}
