"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OctantEdge, OctantNode } from "@/lib/similarity";
import {
  buildHeatField,
  traitColor,
  traitRadius,
  traitUnit,
  type OctantViewMode,
  type TraitMeta,
} from "@/lib/octant-viz";
import { layoutNodeLabels } from "@/lib/label-layout";

type Props = {
  nodes: OctantNode[];
  edges: OctantEdge[];
  /** formId -> trait scores */
  fixedById: Record<string, Record<string, number>>;
  viewMode: OctantViewMode;
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

export function OctantCanvas({
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const heatRef = useRef<HTMLCanvasElement>(null);
  const baseHeightRef = useRef(560);
  const panelOpenRef = useRef(panelOpen);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  panelOpenRef.current = panelOpen;
  const [showEdges, setShowEdges] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;

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

  function zoomAtPoint(clientX: number, clientY: number, nextZoom: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    const rect = svg.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;
    const contentX = (sx - currentPan.x) / currentZoom;
    const contentY = (sy - currentPan.y) / currentZoom;
    const nextPanX = sx - contentX * clamped;
    const nextPanY = sy - contentY * clamped;
    zoomRef.current = clamped;
    panRef.current = { x: nextPanX, y: nextPanY };
    setZoom(clamped);
    setPan({ x: nextPanX, y: nextPanY });
  }

  function stepZoom(direction: 1 | -1) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    zoomAtPoint(cx, cy, zoom + direction * 0.25);
  }

  function resetZoom() {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      zoomAtPoint(e.clientX, e.clientY, zoomRef.current * factor);
    }
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  function beginDrag(clientX: number, clientY: number) {
    draggingRef.current = true;
    dragMovedRef.current = false;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
    setIsDragging(true);
  }

  function continueDrag(clientX: number, clientY: number) {
    if (!draggingRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      dragMovedRef.current = true;
    }
    const nextPan = {
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    };
    panRef.current = nextPan;
    setPan(nextPan);
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    if (dragMovedRef.current) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
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
        ref={viewportRef}
        className="relative flex-1 overflow-hidden rounded-3xl border border-[var(--line)] bg-white/55 shadow-[0_20px_60px_-30px_rgba(40,70,120,0.35)]"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          beginDrag(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => continueDrag(e.clientX, e.clientY)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClick={() => {
          if (suppressClickRef.current) return;
          onClearSelection();
        }}
      >
        <div
          className="absolute right-3 top-3 z-30 inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white/92 p-1 text-sm font-semibold shadow-sm"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => stepZoom(-1)}
            disabled={zoom <= MIN_ZOOM + 0.001}
            className="rounded-full px-2 py-1 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom out"
            title="Zoom out"
          >
            −
          </button>
          <span className="min-w-[3.5rem] text-center text-xs text-[var(--muted)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => stepZoom(1)}
            disabled={zoom >= MAX_ZOOM - 0.001}
            className="rounded-full px-2 py-1 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zoom in"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={resetZoom}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
            className="ml-1 rounded-full px-2 py-1 text-xs text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-40"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
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
          style={{
            opacity: viewMode === "heat" ? 1 : 0,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
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
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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
                  strokeWidth={(1 + e.similarity * 3) / zoom}
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
                    r={10 / zoom}
                    fill={viewMode === "default" ? PALETTE[i % PALETTE.length] : "#cbd5e1"}
                    stroke="white"
                    strokeWidth={2 / zoom}
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
                  if (suppressClickRef.current) return;
                  e.stopPropagation();
                  onNodeClick(n.id, e.metaKey || e.ctrlKey);
                }}
                opacity={dim ? 0.35 : 1}
                style={{ transition: "opacity 200ms ease" }}
              >
                {isSelected ? (
                  <circle
                    r={(nodeRadius(n, isHovered) + 6) / zoom}
                    fill="none"
                    stroke="var(--violet)"
                    strokeWidth={2.5 / zoom}
                    strokeOpacity={0.7}
                  />
                ) : null}
                <circle
                  r={nodeRadius(n, isHovered) / zoom}
                  fill={nodeFill(n, i)}
                  stroke={viewMode === "heat" ? "var(--ink)" : "white"}
                  strokeWidth={(viewMode === "heat" ? 1.5 : 3) / zoom}
                  style={{
                    filter:
                      viewMode === "heat"
                        ? "drop-shadow(0 4px 10px rgba(40,70,120,0.2))"
                        : "drop-shadow(0 8px 16px rgba(40,70,120,0.25))",
                    transition: "r 180ms ease",
                  }}
                />
                <text
                  x={label.dx / zoom}
                  y={label.dy / zoom}
                  textAnchor={label.textAnchor}
                  dominantBaseline={label.dominantBaseline}
                  className="select-none"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 12 / zoom,
                    fontWeight: 700,
                    fill: "var(--ink)",
                  }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
          </g>
        </svg>
      </div>
    </div>
  );
}
