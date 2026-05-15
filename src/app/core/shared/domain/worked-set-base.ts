export interface WorkedSetBase {
  readonly id: string;
  readonly sessionId: string;
  readonly exerciseId: string;
  readonly targetSetIndex?: number;
  readonly note?: string;
  readonly isPR: boolean;
  readonly createdAt: Date;
}
