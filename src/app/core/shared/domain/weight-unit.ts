/**
 * WeightUnit — unit of measurement stored on an Exercise.
 * 'kg'     → standard kilogram input (decimal, step 0.5)
 * 'plates' → abstract machine stack plates (integer, step 1, no kg conversion)
 *
 * Note: 'lb' is a DISPLAY preference (ProfileRow.preferredUnit) and lives
 * separately from this per-exercise unit.  Do NOT add 'lb' here.
 */
export type WeightUnit = 'kg' | 'plates';

/** Options for building a UI selector. */
export const WEIGHT_UNIT_OPTIONS: readonly { value: WeightUnit; label: string }[] = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'plates', label: 'Placas (máquina)' },
];

/** Weight of one plate when a plates exercise does not set its own (S11). */
export const DEFAULT_PLATE_WEIGHT_KG = 5;

/** The exercise fields that turn a logged weight into kilograms. */
export interface WeightUnitInfo {
  readonly weightUnit: WeightUnit;
  readonly plateWeightKg?: number;
}

/**
 * Kilograms behind a logged weight: plates × plate weight on a plates exercise,
 * the value itself otherwise (or when the exercise is unknown). Only for derived
 * figures such as volume and 1RM: a plates set is still shown as "N placas".
 */
export function loadKg(weight: number, exercise?: WeightUnitInfo | null): number {
  if (exercise?.weightUnit !== 'plates') return weight;
  return weight * (exercise.plateWeightKg ?? DEFAULT_PLATE_WEIGHT_KG);
}

/**
 * The plate weight worth saving: a positive number on a plates exercise.
 * Anything else is dropped, so the exercise falls back to the default.
 */
export function normalizePlateWeightKg(weightUnit: WeightUnit, value: number | null | undefined): number | undefined {
  if (weightUnit !== 'plates' || typeof value !== 'number') return undefined;
  return Number.isFinite(value) && value > 0 ? value : undefined;
}
