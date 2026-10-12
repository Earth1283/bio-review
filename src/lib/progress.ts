const REVIEWED_UNITS_KEY = 'carrying-capacity:reviewed-units';

export function readReviewedUnitIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(REVIEWED_UNITS_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

export function setUnitReviewed(unitId: string, reviewed: boolean): void {
  const reviewedIds = readReviewedUnitIds();
  if (reviewed) reviewedIds.add(unitId);
  else reviewedIds.delete(unitId);
  try {
    localStorage.setItem(REVIEWED_UNITS_KEY, JSON.stringify([...reviewedIds]));
  } catch {}
}

export function readSavedJson<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : (JSON.parse(saved) as T);
  } catch {
    return fallback;
  }
}

export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
