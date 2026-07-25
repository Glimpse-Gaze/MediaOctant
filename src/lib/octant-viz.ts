/** Shared trait encoding helpers for Octant color/size and heat views. */

export type OctantViewMode = "default" | "colorSize" | "heat";

export type TraitMeta = {
  code: string;
  name: string;
  minValue: number;
  maxValue: number;
};

/** Normalize trait value to 0–1 using trait min/max. */
export function traitUnit(value: number, trait: TraitMeta): number {
  const span = Math.max(trait.maxValue - trait.minValue, 1e-6);
  return Math.max(0, Math.min(1, (value - trait.minValue) / span));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Cyan → sun → coral scale (low → high). */
export function traitColor(unit: number): string {
  const u = Math.max(0, Math.min(1, unit));
  const stops = [
    { t: 0, r: 34, g: 197, b: 197 }, // #22c5c5
    { t: 0.5, r: 255, g: 209, b: 102 }, // #ffd166
    { t: 1, r: 255, g: 122, b: 89 }, // #ff7a59
  ];
  const hi = stops.findIndex((s) => s.t >= u);
  const i = hi <= 0 ? 1 : hi;
  const a = stops[i - 1];
  const b = stops[i];
  const local = (u - a.t) / Math.max(b.t - a.t, 1e-6);
  const r = Math.round(lerp(a.r, b.r, local));
  const g = Math.round(lerp(a.g, b.g, local));
  const bl = Math.round(lerp(a.b, b.b, local));
  return `rgb(${r}, ${g}, ${bl})`;
}

export function traitRadius(unit: number, hovered = false): number {
  const base = 8 + unit * 14;
  return hovered ? base + 3 : base;
}

export type HeatSample = { x: number; y: number; value: number };

/**
 * Inverse-distance heat field on a coarse grid.
 * Returns ImageData-ready RGBA buffer + dimensions.
 */
export function buildHeatField(
  width: number,
  height: number,
  samples: HeatSample[],
  opts?: { cell?: number; sigma?: number },
): { width: number; height: number; data: Uint8ClampedArray } | null {
  if (!width || !height || samples.length === 0) return null;

  const cell = opts?.cell ?? 8;
  const sigma = opts?.sigma ?? Math.max(width, height) * 0.12;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const data = new Uint8ClampedArray(cols * rows * 4);
  const twoSigma2 = 2 * sigma * sigma;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = (col + 0.5) * cell;
      const y = (row + 0.5) * cell;
      let num = 0;
      let den = 0;
      for (const s of samples) {
        const dx = x - s.x;
        const dy = y - s.y;
        const w = Math.exp(-(dx * dx + dy * dy) / twoSigma2);
        num += w * s.value;
        den += w;
      }
      const unit = den > 1e-9 ? num / den : 0;
      const color = traitColorRgb(unit);
      // Stronger alpha for higher values so heat “pools” read clearly
      const alpha = Math.round(40 + unit * 140);
      const i = (row * cols + col) * 4;
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
      data[i + 3] = alpha;
    }
  }

  return { width: cols, height: rows, data };
}

function traitColorRgb(unit: number): { r: number; g: number; b: number } {
  const u = Math.max(0, Math.min(1, unit));
  const stops = [
    { t: 0, r: 34, g: 197, b: 197 },
    { t: 0.5, r: 255, g: 209, b: 102 },
    { t: 1, r: 255, g: 122, b: 89 },
  ];
  const hi = stops.findIndex((s) => s.t >= u);
  const i = hi <= 0 ? 1 : hi;
  const a = stops[i - 1];
  const b = stops[i];
  const local = (u - a.t) / Math.max(b.t - a.t, 1e-6);
  return {
    r: Math.round(lerp(a.r, b.r, local)),
    g: Math.round(lerp(a.g, b.g, local)),
    b: Math.round(lerp(a.b, b.b, local)),
  };
}
