export interface Routine {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
