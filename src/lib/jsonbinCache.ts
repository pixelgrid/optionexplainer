// JSONBin v3 cache layer for Alpha Vantage responses.
// Index of page:ticker → binId is kept in localStorage under JB_INDEX_KEY.

const JB_BASE = 'https://api.jsonbin.io/v3';
const JB_KEY = '$2a$10$HNROZOgUb4v747JFAP6B3.KbI2ihd35yOxHkQIN.upa/4.baYTtwe';
const JB_INDEX_KEY = 'jb_index';

function getIndex(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(JB_INDEX_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function setIndex(index: Record<string, string>) {
  localStorage.setItem(JB_INDEX_KEY, JSON.stringify(index));
}

function cacheKey(page: string, ticker: string) {
  return `${page}:${ticker.toUpperCase()}`;
}

const headers = (extra: Record<string, string> = {}) => ({
  'X-Access-Key': JB_KEY,
  'Content-Type': 'application/json',
  ...extra,
});

/** Returns cached data for page+ticker, or null if not cached. */
export async function getCached<T>(page: string, ticker: string): Promise<T | null> {
  const binId = getIndex()[cacheKey(page, ticker)];
  if (!binId) return null;
  try {
    const res = await fetch(`${JB_BASE}/b/${binId}/latest`, {
      headers: { 'X-Access-Key': JB_KEY },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.record as T;
  } catch {
    return null;
  }
}

/** Saves data to JSONBin (creates new bin or updates existing one). */
export async function saveCache<T>(page: string, ticker: string, data: T): Promise<void> {
  const key = cacheKey(page, ticker);
  const index = getIndex();
  const binId = index[key];

  try {
    if (binId) {
      await fetch(`${JB_BASE}/b/${binId}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ record: data }),
      });
    } else {
      const res = await fetch(`${JB_BASE}/b`, {
        method: 'POST',
        headers: headers({ 'X-Bin-Name': key }),
        body: JSON.stringify({ record: data }),
      });
      if (res.ok) {
        const json = await res.json();
        index[key] = json.metadata.id;
        setIndex(index);
      }
    }
  } catch {
    // Cache save failure is non-fatal
  }
}

/** Removes the cache entry so the next fetch goes to Alpha Vantage. */
export function clearCache(page: string, ticker: string): void {
  const key = cacheKey(page, ticker);
  const index = getIndex();
  delete index[key];
  setIndex(index);
}

/** Returns true if a cached bin exists for page+ticker. */
export function hasCached(page: string, ticker: string): boolean {
  return !!getIndex()[cacheKey(page, ticker)];
}
