/** Greedy label placement that avoids overlapping nodes and other labels. */

export type LabelNode = {
  id: string;
  name: string;
  x: number;
  y: number;
  r: number;
};

export type LabelLayout = {
  dx: number;
  dy: number;
  textAnchor: "start" | "middle" | "end";
  dominantBaseline: "auto" | "hanging" | "middle";
};

type Rect = { left: number; top: number; right: number; bottom: number };

function estimateTextWidth(name: string): number {
  // Approximate Space Grotesk bold @ 12px
  return Math.max(24, name.length * 7.1);
}

function labelRect(
  node: LabelNode,
  dx: number,
  dy: number,
  textAnchor: LabelLayout["textAnchor"],
  dominantBaseline: LabelLayout["dominantBaseline"],
): Rect {
  const w = estimateTextWidth(node.name);
  const h = 14;
  let left = node.x + dx;
  if (textAnchor === "middle") left -= w / 2;
  else if (textAnchor === "end") left -= w;

  let top = node.y + dy;
  if (dominantBaseline === "middle") top -= h / 2;
  else if (dominantBaseline === "auto") top -= h; // text sits above the baseline point
  // hanging: top is already the top of the glyphs

  return { left, top, right: left + w, bottom: top + h };
}

function overlaps(a: Rect, b: Rect, pad = 3): boolean {
  return !(
    a.right + pad < b.left ||
    a.left - pad > b.right ||
    a.bottom + pad < b.top ||
    a.top - pad > b.bottom
  );
}

function circleRectOverlap(cx: number, cy: number, r: number, rect: Rect, pad = 2): boolean {
  const nearestX = Math.max(rect.left, Math.min(cx, rect.right));
  const nearestY = Math.max(rect.top, Math.min(cy, rect.bottom));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < (r + pad) * (r + pad);
}

type Candidate = Omit<LabelLayout, never> & { preference: number };

function candidatesFor(node: LabelNode): Candidate[] {
  const gap = 10;
  const r = node.r;
  return [
    { dx: 0, dy: r + gap + 4, textAnchor: "middle", dominantBaseline: "hanging", preference: 0 },
    { dx: 0, dy: -(r + gap), textAnchor: "middle", dominantBaseline: "auto", preference: 1 },
    { dx: r + gap, dy: 0, textAnchor: "start", dominantBaseline: "middle", preference: 2 },
    { dx: -(r + gap), dy: 0, textAnchor: "end", dominantBaseline: "middle", preference: 2 },
    { dx: r + gap * 0.7, dy: r + gap * 0.7, textAnchor: "start", dominantBaseline: "hanging", preference: 3 },
    { dx: -(r + gap * 0.7), dy: r + gap * 0.7, textAnchor: "end", dominantBaseline: "hanging", preference: 3 },
    { dx: r + gap * 0.7, dy: -(r + gap * 0.7), textAnchor: "start", dominantBaseline: "auto", preference: 3 },
    { dx: -(r + gap * 0.7), dy: -(r + gap * 0.7), textAnchor: "end", dominantBaseline: "auto", preference: 3 },
  ];
}

/**
 * Place labels greedily: prefer below, then above / sides / diagonals.
 * Longer names are placed first so short labels yield to them.
 */
export function layoutNodeLabels(
  nodes: LabelNode[],
  bounds?: { width: number; height: number },
): Map<string, LabelLayout> {
  const result = new Map<string, LabelLayout>();
  const placedRects: Rect[] = [];

  const ordered = [...nodes].sort((a, b) => b.name.length - a.name.length);

  for (const node of ordered) {
    const options = candidatesFor(node);
    let best: { layout: LabelLayout; score: number; rect: Rect } | null = null;

    for (const opt of options) {
      const rect = labelRect(node, opt.dx, opt.dy, opt.textAnchor, opt.dominantBaseline);

      // Softly prefer staying on-canvas
      let score = opt.preference * 10;
      if (bounds) {
        if (rect.left < 4) score += 20;
        if (rect.top < 4) score += 20;
        if (rect.right > bounds.width - 4) score += 20;
        if (rect.bottom > bounds.height - 4) score += 20;
      }

      let hitNode = false;
      for (const other of nodes) {
        // Always avoid own and others' circles
        if (circleRectOverlap(other.x, other.y, other.r, rect)) {
          hitNode = true;
          break;
        }
      }
      if (hitNode) score += 1000;

      let hitLabel = false;
      for (const pr of placedRects) {
        if (overlaps(rect, pr)) {
          hitLabel = true;
          break;
        }
      }
      if (hitLabel) score += 500;

      if (!best || score < best.score) {
        best = {
          layout: {
            dx: opt.dx,
            dy: opt.dy,
            textAnchor: opt.textAnchor,
            dominantBaseline: opt.dominantBaseline,
          },
          score,
          rect,
        };
        if (score < 10) break; // good enough (preferred, no collision)
      }
    }

    if (best) {
      result.set(node.id, best.layout);
      placedRects.push(best.rect);
    } else {
      result.set(node.id, {
        dx: 0,
        dy: node.r + 14,
        textAnchor: "middle",
        dominantBaseline: "hanging",
      });
    }
  }

  return result;
}
