"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AtlasEdge, AtlasNode } from "@/lib/similarity";
import {
  buildHeatField,
  traitColor,
  traitRadius,
  traitUnit,
  type AtlasViewMode,
  type TraitMeta,
} from "@/lib/atlas-viz";
import { layoutNodeLabels } from "@/lib/label-layout";

type Props = {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  /** formId -> trait scores */
  fixedById: Record<string, Record<string, number>>;
  viewMode: AtlasViewMode;
  encodeTrait: TraitMeta;
  /** When set, nodes not in this set are dimmed/hidden */
  visibleIds?: Set<string> | null;
  /** Selected node ids (0–2) for compare panels */
  selectedIds: string[];
  /** Plain click / clear: pass a single id or null. Additive handled via onNodeClick. */
  onClearSelection: () => void;
  onNodeClick: (id: string, additive: boolean) => void;
  /** When true, map may grow with the side panel; on close height resets. */
  panelOpen?: boolean;
};

const PALETTE = [
  "var(--cyan)",
  "var(--violet)",
  "var(--coral)",
  "var(--lime)",
  "var(--sun)",
];

export function AtlasCanvas({
  nodes,
  edges,
  fixedById,
  viewMode,
  encodeTrait,
  visibleIds = null,
  selectedIds,
  onClearSelection,
  onNodeClick,
  panelOpen = false,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const heatRef = useRef<HTMLCanvasElement>(null);
  const baseHeightRef = useRef(560);
  const panelOpenRef = useRef(panelOpen);
  panelOpenRef.current = panelOpen;
  const [showEdges, setShowEdges] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = Math.max(1, el.clientWidth);
      const measured = Math.max(480, el.clientHeight);
      if (panelOpenRef.current) {
        // Panel open: follow stretched container height
        setSize({ w, h: measured });
        return;
      }
      // Panel closed: never adopt an inflated height left over from stretch
      if (measured > baseHeightRef.current + 16) {
        setSize({ w, h: baseHeightRef.current });
        return;
      }
      baseHeightRef.current = measured;
      setSize({ w, h: measured });
    });
    ro.observe(el);
    const w = Math.max(1, el.clientWidth);
    const measured = Math.max(480, el.clientHeight);
    baseHeightRef.current = measured;
    setSize({ w, h: measured });
    return () => ro.disconnect();
  }, []);

  // Closing the panel: restore the height from before it opened
  useEffect(() => {
    if (!panelOpen) {
      setSize((s) => ({ ...s, h: baseHeightRef.current }));
    }
  }, [panelOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClearSelection();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClearSelection]);

  const filtering = visibleIds !== null;
  const visibleCount = filtering
    ? nodes.filter((n) => visibleIds!.has(n.id)).length
    : nodes.length;

  const placed = useMemo(() => {
    if (!nodes.length) return [];
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const pad = 80;
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    return nodes.map((n) => ({
      ...n,
      px: pad + ((n.x - minX) / spanX) * (size.w - pad * 2),
      py: pad + ((n.y - minY) / spanY) * (size.h - pad * 2),
      traitValue: fixedById[n.id]?.[encodeTrait.code] ?? 0,
    }));
  }, [nodes, size, fixedById, encodeTrait.code]);

  const byId = useMemo(() => Object.fromEntries(placed.map((n) => [n.id, n])), [placed]);

  // Heat field canvas
  useEffect(() => {
    const canvas = heatRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size.w;
    canvas.height = size.h;
    ctx.clearRect(0, 0, size.w, size.h);

    if (viewMode !== "heat") return;

    const samples = placed
      .filter((n) => !filtering || visibleIds!.has(n.id))
      .map((n) => ({
        x: n.px,
        y: n.py,
        value: traitUnit(n.traitValue, encodeTrait),
      }));

    const field = buildHeatField(size.w, size.h, samples);
    if (!field) return;

    const img = ctx.createImageData(field.width, field.height);
    img.data.set(field.data);
    // Draw low-res then scale up with blur-ish smoothing
    const tmp = document.createElement("canvas");
    tmp.width = field.width;
    tmp.height = field.height;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(tmp, 0, 0, size.w, size.h);
  }, [viewMode, placed, size, encodeTrait, filtering, visibleIds]);

  function restingRadius(n: (typeof placed)[number]): number {
    if (viewMode === "colorSize") {
      return traitRadius(traitUnit(n.traitValue, encodeTrait), false);
    }
    if (viewMode === "heat") return 11;
    return 14;
  }

  const labelLayouts = useMemo(() => {
    const visible = placed.filter((n) => !filtering || visibleIds!.has(n.id));
    return layoutNodeLabels(
      visible.map((n) => ({
        id: n.id,
        name: n.name,
        x: n.px,
        y: n.py,
        r: restingRadius(n),
      })),
      { width: size.w, height: size.h },
    );
    // restingRadius depends on viewMode/encodeTrait via placed trait values
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional inputs listed
  }, [placed, filtering, visibleIds, viewMode, encodeTrait, size.w, size.h]);

  function nodeFill(n: (typeof placed)[number], index: number): string {
    if (viewMode === "colorSize") {
      return traitColor(traitUnit(n.traitValue, encodeTrait));
    }
    if (viewMode === "heat") {
      return "#ffffff";
    }
    return PALETTE[index % PALETTE.length];
  }

  function nodeRadius(n: (typeof placed)[number], isHovered: boolean): number {
    if (viewMode === "colorSize") {
      return traitRadius(traitUnit(n.traitValue, encodeTrait), isHovered);
    }
    if (viewMode === "heat") {
      return isHovered ? 13 : 11;
    }
    return isHovered ? 18 : 14;
  }

  return (
    <div className="relative flex h-full min-h-[520px] flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-[var(--muted)]">
          {viewMode === "default" &&
            "Forms with similar traits sit closer together. Click a node for its profile; ⌘/Ctrl-click to compare two."}
          {viewMode === "colorSize" &&
            `Color and size show ${encodeTrait.code} (${encodeTrait.name}). Position is still overall similarity.`}
          {viewMode === "heat" &&
            `Background heat shows ${encodeTrait.code} density. Nodes stay even-sized; position is overall similarity.`}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-sm font-semibold shadow-sm">
          <input
            type="checkbox"
            checked={showEdges}
            onChange={(e) => setShowEdges(e.target.checked)}
            className="accent-[var(--violet)]"
          />
          Show edges
        </label>
      </div>

      <div
        className="relative flex-1 overflow-hidden rounded-3xl border border-[var(--line)] bg-white/55 shadow-[0_20px_60px_-30px_rgba(40,70,120,0.35)]"
        onClick={() => onClearSelection()}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(90,120,180,0.16) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <canvas
          ref={heatRef}
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
          style={{ opacity: viewMode === "heat" ? 1 : 0 }}
          aria-hidden
        />
        {filtering && visibleCount === 0 ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
            <p className="rounded-2xl bg-white/90 px-5 py-4 text-sm font-semibold text-[var(--muted)] shadow-sm">
              No forms match the selected tags. Try Any mode or clear the filter.
            </p>
          </div>
        ) : null}
        <svg
          ref={svgRef}
          width={size.w}
          height={size.h}
          className="relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {showEdges &&
            edges.map((e) => {
              const a = byId[e.source];
              const b = byId[e.target];
              if (!a || !b) return null;
              if (filtering && (!visibleIds!.has(e.source) || !visibleIds!.has(e.target))) {
                return null;
              }
              const active =
                !hovered || hovered === e.source || hovered === e.target;
              return (
                <line
                  key={`${e.source}-${e.target}`}
                  x1={a.px}
                  y1={a.py}
                  x2={b.px}
                  y2={b.py}
                  stroke="url(#edgeGrad)"
                  strokeWidth={1 + e.similarity * 3}
                  strokeOpacity={active ? 0.55 : 0.08}
                  className="transition-opacity duration-300"
                />
              );
            })}

          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c5c5" />
              <stop offset="50%" stopColor="#7b6cff" />
              <stop offset="100%" stopColor="#ff7a59" />
            </linearGradient>
          </defs>

          {placed.map((n, i) => {
            const isVisible = !filtering || visibleIds!.has(n.id);
            const isHovered = hovered === n.id;
            const isSelected = selectedIds.includes(n.id);

            if (filtering && !isVisible) {
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.px}, ${n.py})`}
                  opacity={0.12}
                  style={{ transition: "opacity 200ms ease", pointerEvents: "none" }}
                >
                  <circle
                    r={10}
                    fill={viewMode === "default" ? PALETTE[i % PALETTE.length] : "#cbd5e1"}
                    stroke="white"
                    strokeWidth={2}
                  />
                </g>
              );
            }

            const dim = hovered && !isHovered;
            const label = labelLayouts.get(n.id) ?? {
              dx: 0,
              dy: nodeRadius(n, false) + 14,
              textAnchor: "middle" as const,
              dominantBaseline: "hanging" as const,
            };
            return (
              <g
                key={n.id}
                transform={`translate(${n.px}, ${n.py})`}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(n.id, e.metaKey || e.ctrlKey);
                }}
                opacity={dim ? 0.35 : 1}
                style={{ transition: "opacity 200ms ease" }}
              >
                {isSelected ? (
                  <circle
                    r={nodeRadius(n, isHovered) + 6}
                    fill="none"
                    stroke="var(--violet)"
                    strokeWidth={2.5}
                    strokeOpacity={0.7}
                  />
                ) : null}
                <circle
                  r={nodeRadius(n, isHovered)}
                  fill={nodeFill(n, i)}
                  stroke={viewMode === "heat" ? "var(--ink)" : "white"}
                  strokeWidth={viewMode === "heat" ? 1.5 : 3}
                  style={{
                    filter:
                      viewMode === "heat"
                        ? "drop-shadow(0 4px 10px rgba(40,70,120,0.2))"
                        : "drop-shadow(0 8px 16px rgba(40,70,120,0.25))",
                    transition: "r 180ms ease",
                  }}
                />
                <text
                  x={label.dx}
                  y={label.dy}
                  textAnchor={label.textAnchor}
                  dominantBaseline={label.dominantBaseline}
                  className="select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 12,
                    fontWeight: 700,
                    fill: "var(--ink)",
                  }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
