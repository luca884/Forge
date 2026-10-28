/**
 * A plates set is always shown as plates, never in kg or lb (D4): "1 placa", "7 placas".
 * Also fits a difference between two plates sets: "+1 placa", "+2 placas".
 */
export function formatPlates(count: number): string {
  return `${count} ${count === 1 ? 'placa' : 'placas'}`;
}
