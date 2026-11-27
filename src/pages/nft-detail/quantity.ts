export function boundedQuantity(requested: number, available: number) {
  if (!Number.isSafeInteger(available) || available < 1) return 0;
  if (!Number.isSafeInteger(requested)) return 1;
  return Math.min(available, Math.max(1, requested));
}
