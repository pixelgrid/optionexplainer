export interface BSInputs {
  S: number;   // Stock price
  K: number;   // Strike price
  T: number;   // Time to expiry in years
  r: number;   // Risk-free rate as decimal (e.g. 0.05)
  sigma: number; // Implied volatility as decimal (e.g. 0.30)
}

export interface BSResult {
  call: number;
  put: number;
  delta_call: number;
  delta_put: number;
  gamma: number;
  theta_call: number; // per calendar day
  theta_put: number;  // per calendar day
  vega: number;       // per 1% change in IV
  d1: number;
  d2: number;
}

// Abramowitz & Stegun approximation (maximum error 7.5e-8)
export function normCdf(x: number): number {
  if (x < -8) return 0;
  if (x > 8) return 1;
  const sign = x >= 0 ? 1 : -1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.2316419 * z);
  const d = 0.3989422820 * Math.exp(-0.5 * z * z);
  const p =
    d *
    t *
    (0.3193815301 +
      t * (-0.3565637813 + t * (1.7814779372 + t * (-1.8212559979 + t * 1.3302744929))));
  return sign === 1 ? 1 - p : p;
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function blackScholes(inputs: BSInputs): BSResult {
  const { S, K, r, sigma } = inputs;
  let { T } = inputs;

  // Edge case: expiry has passed — return intrinsic values
  if (T <= 0) {
    const call = Math.max(S - K, 0);
    const put = Math.max(K - S, 0);
    return {
      call,
      put,
      delta_call: S > K ? 1 : S === K ? 0.5 : 0,
      delta_put: S < K ? -1 : S === K ? -0.5 : 0,
      gamma: 0,
      theta_call: 0,
      theta_put: 0,
      vega: 0,
      d1: 0,
      d2: 0,
    };
  }

  // Clamp T to avoid numerical issues
  T = Math.max(T, 1e-8);

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const Nd1 = normCdf(d1);
  const Nd2 = normCdf(d2);
  const Nnd1 = normCdf(-d1);
  const Nnd2 = normCdf(-d2);
  const nd1 = normPdf(d1);

  const discountFactor = Math.exp(-r * T);

  const call = S * Nd1 - K * discountFactor * Nd2;
  const put = K * discountFactor * Nnd2 - S * Nnd1;

  const delta_call = Nd1;
  const delta_put = Nd1 - 1; // = -N(-d1)

  const gamma = nd1 / (S * sigma * sqrtT);

  // Theta: dV/dT (annualized), convert to per calendar day (/365)
  const theta_call_annual =
    -(S * nd1 * sigma) / (2 * sqrtT) - r * K * discountFactor * Nd2;
  const theta_put_annual =
    -(S * nd1 * sigma) / (2 * sqrtT) + r * K * discountFactor * Nnd2;

  const theta_call = theta_call_annual / 365;
  const theta_put = theta_put_annual / 365;

  // Vega: dV/d(sigma), then per 1% change = /100
  const vega = S * sqrtT * nd1 / 100;

  return {
    call,
    put,
    delta_call,
    delta_put,
    gamma,
    theta_call,
    theta_put,
    vega,
    d1,
    d2,
  };
}
