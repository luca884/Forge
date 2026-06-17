import { Injectable, inject } from '@angular/core';
import { TrackingType, assertNever } from '@core/shared/domain/tracking-type';
import { Reps } from '@core/shared/domain/value-objects/reps';
import { Weight } from '@core/shared/domain/value-objects/weight';
import { EventBus } from '@core/shared/events/event-bus';
import { generateUUID } from '@core/shared/utils/uuid';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { SessionRepository } from '../session.repository';
import { PersonalRecordDetector } from '../services/personal-record-detector';
import { WorkedSet, WeightRepsSet, BodyweightRepsSet } from '../worked-set';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { InvalidSetInputError } from '../errors/invalid-set-input.error';
import { WorkedSetLoggedEvent } from '../events/worked-set-logged.event';
import { PersonalRecordAchievedEvent } from '../events/personal-record-achieved.event';
import { PersonalRecord } from '@features/progress/domain/entities/personal-record.entity';

export interface LogSetInput {
  sessionId: string;
  exerciseId: string;
  targetSetIndex?: number;
  type: TrackingType;
  repsValue?: number;
  weightKgValue?: number;
  extraWeightKgValue?: number;
  durationSecValue?: number;
  distanceKmValue?: number;
  note?: string;
}

@Injectable()
export class LogSetUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly prDetector = inject(PersonalRecordDetector);
  private readonly eventBus = inject(EventBus);
  private readonly prRepo = inject(PersonalRecordRepository);

  async execute(input: LogSetInput): Promise<WorkedSet> {
    const session = await this.sessionRepo.getById(input.sessionId);
    if (!session) {
      throw new SessionNotFoundError(input.sessionId);
    }
    if (session.status !== 'in-progress') {
      throw new SessionNotInProgressError(input.sessionId, session.status);
    }

    const newSet = this.buildSet(input);
    const history = await this.sessionRepo.getAllWorkedSetsForExercise(input.exerciseId);
    const isPR = this.prDetector.isPR(newSet, history);
    const finalSet: WorkedSet = { ...newSet, isPR } as WorkedSet;

    // 1. Persist the set first (always).
    await this.sessionRepo.addSetToSession(input.sessionId, finalSet);

    // 2. If PR: persist the PersonalRecord synchronously BEFORE emitting events (ADR-12).
    //    Save BEFORE event so subscribers see consistent state.
    //    Partial failure: try/catch — if PR save fails, set is already persisted (acceptable R-8).
    if (isPR) {
      const record: PersonalRecord = {
        id: generateUUID(),
        exerciseId: finalSet.exerciseId,
        trackingType: finalSet.type,
        workedSetId: finalSet.id,
        achievedAt: finalSet.createdAt,
        set: finalSet,
      };
      try {
        await this.prRepo.save(record);
      } catch (err) {
        // R-8: PR save failure is acceptable for v1. Set is already persisted.
        // slice-3 reconciliation pass can recover from isPR flag on workedSets.
        console.error('[LogSetUseCase] Failed to persist PersonalRecord (non-fatal):', err);
      }
    }

    // 3. Publish events after persistence (both WorkedSetLogged and PersonalRecordAchieved).
    this.eventBus.publish<WorkedSetLoggedEvent>({
      name: 'WorkedSetLogged',
      occurredAt: new Date(),
      sessionId: input.sessionId,
      workedSet: finalSet,
    });

    if (isPR) {
      this.eventBus.publish<PersonalRecordAchievedEvent>({
        name: 'PersonalRecordAchieved',
        occurredAt: new Date(),
        sessionId: input.sessionId,
        workedSet: finalSet,
        reason: history.length === 0 ? 'first-set' : 'more-reps',
      });
    }

    return finalSet;
  }

  private buildSet(input: LogSetInput): WorkedSet {
    const base = {
      id: generateUUID(),
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      targetSetIndex: input.targetSetIndex,
      note: input.note,
      isPR: false, // will be overridden after prDetector
      createdAt: new Date(),
    };

    switch (input.type) {
      case 'weight-reps': {
        const repsResult = Reps.tryFrom(input.repsValue ?? 0);
        if (!repsResult.ok) throw new InvalidSetInputError(repsResult.error);

        const weightResult = Weight.tryFrom(input.weightKgValue ?? 0);
        if (!weightResult.ok) throw new InvalidSetInputError(weightResult.error);

        return { ...base, type: 'weight-reps', reps: repsResult.value, weight: weightResult.value } as WeightRepsSet;
      }

      case 'bodyweight-reps': {
        const repsResult = Reps.tryFrom(input.repsValue ?? 0);
        if (!repsResult.ok) throw new InvalidSetInputError(repsResult.error);

        let extraWeight: Weight | undefined;
        if (input.extraWeightKgValue !== undefined) {
          const ewResult = Weight.tryFrom(input.extraWeightKgValue);
          if (!ewResult.ok) throw new InvalidSetInputError(ewResult.error);
          extraWeight = ewResult.value;
        }

        return { ...base, type: 'bodyweight-reps', reps: repsResult.value, extraWeight } as BodyweightRepsSet;
      }

      case 'time':
        return { ...base, type: 'time', durationSec: input.durationSecValue ?? 0 };

      case 'distance-time':
        return {
          ...base,
          type: 'distance-time',
          distanceKm: input.distanceKmValue ?? 0,
          durationSec: input.durationSecValue ?? 0,
        };

      default:
        return assertNever(input.type);
    }
  }
}
