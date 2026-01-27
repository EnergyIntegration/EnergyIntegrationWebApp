export function formatHeat(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  const abs = Math.abs(value);
  if (abs >= 1e6 || abs < 1e-2) return value.toExponential(2);
  if (abs >= 100) return value.toFixed(1);
  return value.toFixed(2);
}
