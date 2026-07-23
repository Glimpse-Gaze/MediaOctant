export type FormForSimilarity = {
  id: string;
  name: string;
  slug: string;
  fixed: Record<string, number>; // trait code -> value
  freeform: Array<{ nameNormalized: string; valueNormalized: string }>;
};

export type AtlasNode = {
  id: string;
  name: string;
  slug: string;
  x: number;
  y: number;
};

export type AtlasEdge = {
  source: string;
  target: string;
  similarity: number;
};

const FREEFORM_ALPHA = 0.2;
const EDGE_SIMILARITY_THRESHOLD = 0.72;
const TRAIT_CODES = ["VIS", "AUD", "EMB", "LIV", "SEM", "MAT", "RAU", "TMP"] as const;

function fixedDistance(a: Record<string, number>, b: Record<string, number>): number {
  let sumSq = 0;
  for (const code of TRAIT_CODES) {
    const av = a[code] ?? 0;
    const bv = b[code] ?? 0;
    const d = av - bv;
    sumSq += d * d;
  }
  // Normalize by max possible Euclidean distance in [0,10]^8
  return Math.sqrt(sumSq) / (Math.sqrt(TRAIT_CODES.length) * 10);
}

function freeformSimilarity(
  a: FormForSimilarity["freeform"],
  b: FormForSimilarity["freeform"],
): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a.map((t) => `${t.nameNormalized}::${t.valueNormalized}`));
  const setB = new Set(b.map((t) => `${t.nameNormalized}::${t.valueNormalized}`));
  let shared = 0;
  for (const key of setA) {
    if (setB.has(key)) shared += 1;
  }
  if (shared === 0) return 0;
  return shared / Math.max(setA.size, setB.size, 1);
}

/** Combined distance in [0,1]-ish; lower = more similar */
export function pairDistance(a: FormForSimilarity, b: FormForSimilarity): number {
  const dFixed = fixedDistance(a.fixed, b.fixed);
  const sFree = freeformSimilarity(a.freeform, b.freeform);
  return (1 - FREEFORM_ALPHA) * dFixed + FREEFORM_ALPHA * (1 - sFree);
}

export function pairSimilarity(a: FormForSimilarity, b: FormForSimilarity): number {
  return 1 - pairDistance(a, b);
}

export function nearestNeighbors(
  targetId: string,
  forms: FormForSimilarity[],
  limit = 5,
): Array<{ id: string; name: string; slug: string; similarity: number }> {
  const target = forms.find((f) => f.id === targetId);
  if (!target) return [];
  return forms
    .filter((f) => f.id !== targetId)
    .map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      similarity: pairSimilarity(target, f),
    }))
    .sort((x, y) => y.similarity - x.similarity)
    .slice(0, limit);
}

/** Deterministic 2D layout via classical MDS on distances */
export function layoutAtlas(forms: FormForSimilarity[]): {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
} {
  // Stable input order so identical data always yields the same map
  const ordered = [...forms].sort((a, b) => a.slug.localeCompare(b.slug));
  const n = ordered.length;
  if (n === 0) return { nodes: [], edges: [] };

  if (n === 1) {
    return {
      nodes: [
        {
          id: ordered[0].id,
          name: ordered[0].name,
          slug: ordered[0].slug,
          x: 0,
          y: 0,
        },
      ],
      edges: [],
    };
  }

  const D: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = pairDistance(ordered[i], ordered[j]);
      D[i][j] = d;
      D[j][i] = d;
    }
  }

  const coords = classicalMds(D, 2);

  let maxAbs = 1e-6;
  for (const [x, y] of coords) {
    maxAbs = Math.max(maxAbs, Math.abs(x), Math.abs(y));
  }
  const scale = 280 / maxAbs;

  const nodes: AtlasNode[] = ordered.map((f, i) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    x: coords[i][0] * scale,
    y: coords[i][1] * scale,
  }));

  const edges: AtlasEdge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const similarity = 1 - D[i][j];
      if (similarity >= EDGE_SIMILARITY_THRESHOLD) {
        edges.push({
          source: ordered[i].id,
          target: ordered[j].id,
          similarity,
        });
      }
    }
  }

  return { nodes, edges };
}

function classicalMds(D: number[][], dims: number): number[][] {
  const n = D.length;
  const D2 = D.map((row) => row.map((d) => d * d));
  const rowMeans = D2.map((row) => row.reduce((a, b) => a + b, 0) / n);
  const colMeans = Array.from({ length: n }, (_, j) =>
    D2.reduce((a, row) => a + row[j], 0) / n,
  );
  const grand = rowMeans.reduce((a, b) => a + b, 0) / n;

  const B: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => -0.5 * (D2[i][j] - rowMeans[i] - colMeans[j] + grand)),
  );

  const vectors: number[][] = [];
  const eigenvalues: number[] = [];

  for (let k = 0; k < dims; k++) {
    // Deterministic start vector (no Math.random) so layout is stable across refreshes
    let v = Array.from({ length: n }, (_, i) => 1 / (i + k + 1));
    for (let iter = 0; iter < 100; iter++) {
      let w = matVec(B, v);
      for (let p = 0; p < k; p++) {
        const proj = dot(w, vectors[p]);
        w = w.map((x, i) => x - proj * vectors[p][i]);
      }
      const norm = Math.sqrt(dot(w, w)) || 1;
      v = w.map((x) => x / norm);
    }
    const Bv = matVec(B, v);
    const lambda = dot(v, Bv);
    // Fix eigenvector sign ambiguity (flip so the first non-near-zero entry is positive)
    const pivot = v.find((x) => Math.abs(x) > 1e-9) ?? 1;
    if (pivot < 0) v = v.map((x) => -x);
    vectors.push(v);
    eigenvalues.push(Math.max(lambda, 0));
  }

  return Array.from({ length: n }, (_, i) =>
    vectors.map((v, k) => v[i] * Math.sqrt(eigenvalues[k] || 0)),
  );
}

function matVec(M: number[][], v: number[]): number[] {
  return M.map((row) => row.reduce((s, x, j) => s + x * v[j], 0));
}

function dot(a: number[], b: number[]): number {
  return a.reduce((s, x, i) => s + x * b[i], 0);
}

export { EDGE_SIMILARITY_THRESHOLD, FREEFORM_ALPHA, TRAIT_CODES };
