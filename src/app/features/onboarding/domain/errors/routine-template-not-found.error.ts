export class RoutineTemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Routine template not found: ${templateId}`);
    this.name = 'RoutineTemplateNotFoundError';
  }
}
