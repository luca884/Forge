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
export const WEIGHT_UNIT_OPTIONS: ReadonlyArray<{ value: WeightUnit; label: string }> = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'plates', label: 'Placas (máquina)' },
];
