// JSONBin v3 cache layer for Alpha Vantage responses.
// Index of page:ticker → { id, xl } is kept in localStorage under JB_INDEX_KEY.
// Payloads ≥ 90 KB are automatically routed through XL Bins (up to 10 MB).

const JB_BASE = 'https://api.jsonbin.io/v3';
const JB_XL   = 'https://jsonbin.io';
const JB_KEY  = '$2a$10$HNROZOgUb4v747JFAP6B3.KbI2ihd35yOxHkQIN.upa/4.baYTtwe';
const JB_INDEX_KEY = 'jb_index';
const XL_THRESHOLD = 90_000; // bytes — use XL bin above this size

type BinRef = { id: string; xl?: true };

function getIndex(): Record<string, BinRef> {
  try {
    const raw = JSON.parse(localStorage.getItem(JB_INDEX_KEY) ?? '{}');
    // Migrate old string-only entries
    const out: Record<string, BinRef> = {};
    for (const [k, v] of Object.entries(raw)) {
      out[k] = typeof v === 'string' ? { id: v as string } : (v as BinRef);
    }
    return out;
  } catch {
    return {};
  }
}

function setIndex(index: Record<string, BinRef>) {
  localStorage.setItem(JB_INDEX_KEY, JSON.stringify(index));
}

function cacheKey(page: string, ticker: string) {
  return `${page}:${ticker.toUpperCase()}`;
}

const stdHeaders = (extra: Record<string, string> = {}) => ({
  'X-Access-Key': JB_KEY,
  'Content-Type': 'application/json',
  ...extra,
});

const xlHeaders = () => ({
  'X-Master-Key': JB_KEY,
  'Content-Type': 'application/json',
});

/** Returns cached data for page+ticker, or null if not cached. */
export async function getCached<T>(page: string, ticker: string): Promise<T | null> {
  const ref = getIndex()[cacheKey(page, ticker)];
  if (!ref) return null;
  try {
    let json: Record<string, unknown>;
    if (ref.xl) {
      const res = await fetch(`${JB_XL}/${ref.id}`, { headers: xlHeaders() });
      if (!res.ok) return null;
      json = await res.json();
      // XL bins return { xlbin: data }
      return (json.xlbin ?? json) as T;
    } else {
      const res = await fetch(`${JB_BASE}/b/${ref.id}/latest`, {
        headers: { 'X-Access-Key': JB_KEY },
      });
      if (!res.ok) return null;
      json = await res.json();
      const data = json.record;
      // Unwrap legacy double-wrapped bins
      if (data && typeof data === 'object' && 'record' in (data as object) && Object.keys(data as object).length === 1) {
        return ((data as { record: T }).record);
      }
      return data as T;
    }
  } catch {
    return null;
  }
}

/** Saves data to JSONBin — uses XL bin automatically for large payloads. */
export async function saveCache<T>(page: string, ticker: string, data: T): Promise<void> {
  const key = cacheKey(page, ticker);
  const index = getIndex();
  const ref = index[key];
  const body = JSON.stringify(data);
  const isLarge = body.length >= XL_THRESHOLD;

  try {
    if (ref) {
      if (ref.xl) {
        // Update XL bin
        await fetch(`${JB_XL}/${ref.id}`, {
          method: 'PUT',
          headers: xlHeaders(),
          body: JSON.stringify({ xlbin: data }),
        });
      } else {
        // Update normal bin
        await fetch(`${JB_BASE}/b/${ref.id}`, {
          method: 'PUT',
          headers: stdHeaders(),
          body,
        });
      }
    } else if (isLarge) {
      // Create XL bin
      const res = await fetch(JB_XL, {
        method: 'POST',
        headers: xlHeaders(),
        body: JSON.stringify({ xlbin: data }),
      });
      if (res.ok) {
        const json = await res.json();
        const id = json.metadata?.id ?? json.id;
        if (id) { index[key] = { id, xl: true }; setIndex(index); }
      }
    } else {
      // Create normal bin
      const res = await fetch(`${JB_BASE}/b`, {
        method: 'POST',
        headers: stdHeaders({ 'X-Bin-Name': key }),
        body,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.metadata?.id) { index[key] = { id: json.metadata.id }; setIndex(index); }
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
