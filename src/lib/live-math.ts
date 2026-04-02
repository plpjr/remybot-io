/**
 * Pure math functions for live BTC price analysis.
 * All functions are pure, handle edge cases, and work with standard arrays.
 */

// ─── Algebra / Arithmetic ─────────────────────────────────────────────

export function logReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const result: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const curr = prices[i];
    if (prev <= 0 || curr <= 0) { result.push(0); continue; }
    result.push(Math.log(curr / prev));
  }
  return result;
}

export function sma(prices: number[], window: number): number | null {
  if (prices.length < window || window <= 0) return null;
  let sum = 0;
  for (let i = prices.length - window; i < prices.length; i++) sum += prices[i];
  return sum / window;
}

export function smaArray(prices: number[], window: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < window - 1) { result.push(null); continue; }
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += prices[j];
    result.push(sum / window);
  }
  return result;
}

export function ema(prices: number[], window: number): number | null {
  if (prices.length === 0 || window <= 0) return null;
  const k = 2 / (window + 1);
  let value = prices[0];
  for (let i = 1; i < prices.length; i++) {
    value = prices[i] * k + value * (1 - k);
  }
  return value;
}

// ─── Statistics ───────────────────────────────────────────────────────

export interface RollingStats {
  mean: number;
  stdDev: number;
  skewness: number;
  kurtosis: number;
  zScore: number;
}

export function rollingStats(returns: number[]): RollingStats | null {
  if (returns.length < 3) return null;
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const diffs = returns.map((r) => r - mean);
  const variance = diffs.reduce((a, d) => a + d * d, 0) / n;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return { mean, stdDev: 0, skewness: 0, kurtosis: 0, zScore: 0 };

  const skewness = diffs.reduce((a, d) => a + Math.pow(d / stdDev, 3), 0) / n;
  const kurtosis = diffs.reduce((a, d) => a + Math.pow(d / stdDev, 4), 0) / n - 3; // excess kurtosis
  const zScore = (returns[returns.length - 1] - mean) / stdDev;

  return { mean, stdDev, skewness, kurtosis, zScore };
}

export function quantileRank(value: number, distribution: number[]): number {
  if (distribution.length === 0) return 0;
  const below = distribution.filter((v) => v < value).length;
  return (below / distribution.length) * 100;
}

export function autocorrelation(returns: number[], lag: number): number | null {
  if (returns.length <= lag || lag <= 0) return null;
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    den += (returns[i] - mean) ** 2;
    if (i >= lag) {
      num += (returns[i] - mean) * (returns[i - lag] - mean);
    }
  }
  return den === 0 ? 0 : num / den;
}

// ─── Calculus ─────────────────────────────────────────────────────────

export function rateOfChange(prices: number[]): number | null {
  if (prices.length < 2) return null;
  return prices[prices.length - 1] - prices[prices.length - 2];
}

export function acceleration(prices: number[]): number | null {
  if (prices.length < 3) return null;
  const n = prices.length;
  const v1 = prices[n - 1] - prices[n - 2];
  const v0 = prices[n - 2] - prices[n - 3];
  return v1 - v0;
}

export function cumulativeReturn(prices: number[]): number | null {
  if (prices.length < 2) return null;
  return (prices[prices.length - 1] / prices[0]) - 1;
}

// ─── Information Theory ───────────────────────────────────────────────

export function shannonEntropy(returns: number[], bins: number = 20): number | null {
  if (returns.length < 5) return null;
  const min = Math.min(...returns);
  const max = Math.max(...returns);
  if (min === max) return 0;
  const binWidth = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const r of returns) {
    const idx = Math.min(Math.floor((r - min) / binWidth), bins - 1);
    counts[idx]++;
  }
  let entropy = 0;
  const n = returns.length;
  for (const c of counts) {
    if (c === 0) continue;
    const p = c / n;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

export function predictability(returns: number[], bins: number = 20): number | null {
  const ent = shannonEntropy(returns, bins);
  if (ent === null) return null;
  const maxEntropy = Math.log2(bins);
  if (maxEntropy === 0) return 0;
  return (1 - ent / maxEntropy) * 100;
}

// ─── Fractal Geometry ─────────────────────────────────────────────────

export function hurstExponent(returns: number[]): number | null {
  if (returns.length < 20) return null;
  const logN: number[] = [];
  const logRS: number[] = [];

  // Use chunk sizes from 10 to n/2
  const minChunk = 8;
  const maxChunk = Math.floor(returns.length / 2);
  const sizes: number[] = [];
  for (let s = minChunk; s <= maxChunk; s = Math.floor(s * 1.5)) {
    sizes.push(s);
  }
  if (sizes.length < 2) return 0.5;

  for (const chunkSize of sizes) {
    const numChunks = Math.floor(returns.length / chunkSize);
    if (numChunks === 0) continue;
    let rsSum = 0;
    let validChunks = 0;

    for (let i = 0; i < numChunks; i++) {
      const chunk = returns.slice(i * chunkSize, (i + 1) * chunkSize);
      const mean = chunk.reduce((a, b) => a + b, 0) / chunk.length;
      const deviations = chunk.map((v) => v - mean);

      // Cumulative sum of deviations
      const cumSum: number[] = [];
      let running = 0;
      for (const d of deviations) { running += d; cumSum.push(running); }

      const R = Math.max(...cumSum) - Math.min(...cumSum);
      const S = Math.sqrt(deviations.reduce((a, d) => a + d * d, 0) / chunk.length);

      if (S > 0) {
        rsSum += R / S;
        validChunks++;
      }
    }

    if (validChunks > 0) {
      logN.push(Math.log(chunkSize));
      logRS.push(Math.log(rsSum / validChunks));
    }
  }

  if (logN.length < 2) return 0.5;

  // Linear regression: logRS = H * logN + c
  const n = logN.length;
  const sumX = logN.reduce((a, b) => a + b, 0);
  const sumY = logRS.reduce((a, b) => a + b, 0);
  const sumXY = logN.reduce((a, x, i) => a + x * logRS[i], 0);
  const sumX2 = logN.reduce((a, x) => a + x * x, 0);
  const H = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  return Math.max(0, Math.min(1, H));
}

// ─── Signal Processing ────────────────────────────────────────────────

export interface FFTResult {
  frequencies: number[];
  magnitudes: number[];
  dominantPeriod: number;
  spectralEntropy: number;
  noiseRatio: number;
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// Cooley-Tukey radix-2 FFT (in-place)
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) { j -= m; m >>= 1; }
    j += m;
  }

  // FFT butterflies
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const angle = -2 * Math.PI / size;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);

    for (let i = 0; i < n; i += size) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < half; k++) {
        const tRe = curRe * re[i + k + half] - curIm * im[i + k + half];
        const tIm = curRe * im[i + k + half] + curIm * re[i + k + half];
        re[i + k + half] = re[i + k] - tRe;
        im[i + k + half] = im[i + k] - tIm;
        re[i + k] += tRe;
        im[i + k] += tIm;
        const newCurRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newCurRe;
      }
    }
  }
}

export function fftSpectrum(returns: number[]): FFTResult | null {
  if (returns.length < 16) return null;
  const N = nextPow2(returns.length);
  const re = new Float64Array(N);
  const im = new Float64Array(N);

  // Apply Hann window and zero-pad
  for (let i = 0; i < returns.length; i++) {
    const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (returns.length - 1)));
    re[i] = returns[i] * w;
  }

  fft(re, im);

  const halfN = N >> 1;
  const frequencies: number[] = [];
  const magnitudes: number[] = [];

  for (let i = 1; i < halfN; i++) {
    frequencies.push(i / N);
    magnitudes.push(Math.sqrt(re[i] * re[i] + im[i] * im[i]) / N);
  }

  // Dominant period
  let maxMag = 0;
  let maxIdx = 0;
  for (let i = 0; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxMag) { maxMag = magnitudes[i]; maxIdx = i; }
  }
  const dominantPeriod = frequencies[maxIdx] > 0 ? 1 / frequencies[maxIdx] : 0;

  // Spectral entropy
  const totalPower = magnitudes.reduce((a, m) => a + m * m, 0);
  let spectralEntropy = 0;
  if (totalPower > 0) {
    for (const m of magnitudes) {
      const p = (m * m) / totalPower;
      if (p > 0) spectralEntropy -= p * Math.log2(p);
    }
  }

  // Noise ratio: power outside top-3 frequencies / total
  const sorted = [...magnitudes].sort((a, b) => b - a);
  const topPower = sorted.slice(0, 3).reduce((a, m) => a + m * m, 0);
  const noiseRatio = totalPower > 0 ? 1 - topPower / totalPower : 1;

  return { frequencies, magnitudes, dominantPeriod, spectralEntropy, noiseRatio };
}

// ─── Stochastic Calculus ──────────────────────────────────────────────

export interface GBMParams {
  drift: number; // mu (annualized)
  vol: number;   // sigma (annualized)
  itoCorrection: number;
}

export function gbmParameters(returns: number[], dt: number = 1): GBMParams | null {
  if (returns.length < 5 || dt <= 0) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / returns.length;
  const sigma = Math.sqrt(variance / dt);
  const itoCorr = -0.5 * sigma * sigma;
  const mu = mean / dt + 0.5 * sigma * sigma; // Ito correction
  return { drift: mu, vol: sigma, itoCorrection: itoCorr };
}

export function itoCorrection(sigma: number): number {
  return -0.5 * sigma * sigma;
}

// ─── Linear Algebra ───────────────────────────────────────────────────

export interface PCAResult {
  pc1: number;
  pc2: number;
  eigenvalueRatio: number;
  varianceExplained: number;
}

export function rollingPCA(returns: number[], vol: number[], momentum: number[]): PCAResult | null {
  const n = Math.min(returns.length, vol.length, momentum.length);
  if (n < 5) return null;

  // Use last n points, standardize
  const features = [returns, vol, momentum].map((arr) => {
    const slice = arr.slice(arr.length - n);
    const mean = slice.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(slice.reduce((a, v) => a + (v - mean) ** 2, 0) / n) || 1;
    return slice.map((v) => (v - mean) / std);
  });

  // 3x3 covariance matrix
  const cov: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += features[i][k] * features[j][k];
      cov[i][j] = sum / n;
    }
  }

  // Power iteration for top 2 eigenvalues/vectors
  const eigenPairs = powerIteration3x3(cov);
  if (!eigenPairs) return null;

  const totalVar = cov[0][0] + cov[1][1] + cov[2][2];

  // Project latest data point onto PCs
  const latest = features.map((f) => f[f.length - 1]);
  const pc1 = eigenPairs[0].vector.reduce((a, v, i) => a + v * latest[i], 0);
  const pc2 = eigenPairs[1].vector.reduce((a, v, i) => a + v * latest[i], 0);

  return {
    pc1,
    pc2,
    eigenvalueRatio: eigenPairs[1].value !== 0 ? eigenPairs[0].value / eigenPairs[1].value : Infinity,
    varianceExplained: totalVar > 0 ? ((eigenPairs[0].value + eigenPairs[1].value) / totalVar) * 100 : 0,
  };
}

function powerIteration3x3(mat: number[][]): { value: number; vector: number[] }[] | null {
  const results: { value: number; vector: number[] }[] = [];
  const m = mat.map((r) => [...r]);

  for (let pc = 0; pc < 2; pc++) {
    let v = [1, 0.5, 0.3]; // initial guess
    let eigenvalue = 0;

    for (let iter = 0; iter < 100; iter++) {
      // Multiply
      const next = [0, 0, 0];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) next[i] += m[i][j] * v[j];
      }

      // Find max component
      eigenvalue = Math.sqrt(next.reduce((a, x) => a + x * x, 0));
      if (eigenvalue === 0) break;

      v = next.map((x) => x / eigenvalue);
    }

    results.push({ value: eigenvalue, vector: v });

    // Deflate: M = M - lambda * v * v^T
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        m[i][j] -= eigenvalue * v[i] * v[j];
      }
    }
  }

  return results;
}

// ─── Convenience: Annualization ───────────────────────────────────────

/** Annualize volatility assuming tick-level data with given seconds between ticks */
export function annualizeVol(stdDev: number, avgTickIntervalSec: number): number {
  if (avgTickIntervalSec <= 0) return 0;
  const ticksPerYear = (365.25 * 24 * 3600) / avgTickIntervalSec;
  return stdDev * Math.sqrt(ticksPerYear);
}

export function annualizeDrift(meanReturn: number, avgTickIntervalSec: number): number {
  if (avgTickIntervalSec <= 0) return 0;
  const ticksPerYear = (365.25 * 24 * 3600) / avgTickIntervalSec;
  return meanReturn * ticksPerYear;
}
