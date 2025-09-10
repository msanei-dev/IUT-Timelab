// Utility helpers for time operations
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function overlaps(startA: string, endA: string, startB: string, endB: string): boolean {
  const aS = timeToMinutes(startA);
  const aE = timeToMinutes(endA);
  const bS = timeToMinutes(startB);
  const bE = timeToMinutes(endB);
  return aS < bE && aE > bS;
}
