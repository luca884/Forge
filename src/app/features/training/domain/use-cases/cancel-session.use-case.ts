import { Injectable, inject } from '@angular/core';
import { PersonalRecordRepository } from '@core/shared/domain/ports/personal-record.repository';
import { SessionRepository } from '../session.repository';
import { SessionNotFoundError } from '../errors/session-not-found.error';
import { SessionNotInProgressError } from '../errors/session-not-in-progress.error';

export interface CancelSessionInput {
  sessionId: string;
}

/**
 * CancelSessionUseCase — descarta una sesión in-progress sin guardarla.
 *
 * Orden de borrado (integridad en falla parcial):
 *   1. PRs cuyo workedSetId pertenece a los sets de esta sesión
 *   2. Sets de la sesión
 *   3. Sesión misma
 *
 * Rationale del orden: los PRs referencian sets (workedSetId). Borrar PRs
 * primero garantiza que si la operación se interrumpe, no quedan PRs apuntando
 * a sets que ya no existen. Luego se borran los sets (que apuntan a la sesión),
 * y por último la sesión. El estado queda "pruneable" con reconciliación futura,
 * no corrupto.
 */
@Injectable()
export class CancelSessionUseCase {
  private readonly sessionRepo = inject(SessionRepository);
  private readonly prRepo = inject(PersonalRecordRepository);

  async execute(input: CancelSessionInput): Promise<void> {
    const session = await this.sessionRepo.getById(input.sessionId);
    if (!session) throw new SessionNotFoundError(input.sessionId);
    if (session.status !== 'in-progress') {
      throw new SessionNotInProgressError(input.sessionId, session.status);
    }

    // Leer los sets ANTES de borrar para obtener sus IDs (necesarios para PRs)
    const sets = await this.sessionRepo.getSetsForSession(input.sessionId);
    const setIds = new Set(sets.map(s => s.id));

    // 1. Borrar PRs huérfanos (workedSetId pertenece a sets de esta sesión)
    await this.prRepo.deleteByWorkedSetIds(setIds);

    // 2. Borrar todos los sets de la sesión
    await this.sessionRepo.deleteSetsBySessionId(input.sessionId);

    // 3. Borrar la sesión misma
    await this.sessionRepo.deleteSession(input.sessionId);
  }
}
