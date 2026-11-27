import { Injectable, inject } from '@angular/core';
import { ActivityRepository } from '../activity.repository';

@Injectable()
export class DeleteActivityUseCase {
  private readonly repo = inject(ActivityRepository);

  execute(id: string): Promise<void> {
    return this.repo.delete(id);
  }
}
