export const AV_BASE = 'https://www.alphavantage.co/query';
export const LS_AV_KEY = 'av_api_key';
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function avFetch(fn: string, symbol: string, apiKey: string): Promise<Record<string, unknown>> {
  const url = `${AV_BASE}?function=${fn}&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json['Note']) throw new Error('Alpha Vantage rate limit reached — free tier allows 25 calls/day. Wait a minute or upgrade your key.');
  if (json['Information']) throw new Error('Alpha Vantage: ' + json['Information']);
  if (json['Error Message']) throw new Error('Ticker not found: ' + json['Error Message']);
  return json;
}

export function nn(val: string | undefined | null): number | null {
  if (!val || val === 'None' || val === '-') return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export function fmtMoney(val: number | null): string {
  if (val == null) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e12) return sign + '$' + (abs / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return sign + '$' + (abs / 1e9).toFixed(1) + 'B';
  if (abs >= 1e6) return sign + '$' + (abs / 1e6).toFixed(0) + 'M';
  if (abs >= 1e3) return sign + '$' + (abs / 1e3).toFixed(0) + 'K';
  return sign + '$' + abs.toFixed(2);
}
