"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AtlasEdge, AtlasNode } from "@/lib/similarity";

type Props = {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
};

export function AtlasCanvas({ nodes, edges }: Props) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [showEdges, setShowEdges] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setSize({ w: el.clientWidth, h: Math.max(480, el.clientHeight) });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth, h: Math.max(480, el.clientHeight) });
    return () => ro.disconnect();
  }, []);

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
    }));
  }, [nodes, size]);

  const byId = useMemo(() => Object.fromEntries(placed.map((n) => [n.id, n])), [placed]);

  const palette = [
    "var(--cyan)",
    "var(--violet)",
    "var(--coral)",
    "var(--lime)",
    "var(--sun)",
  ];

  return (
    <div className="relative flex h-full min-h-[520px] flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-[var(--muted)]">
          Forms with similar traits sit closer together. Toggle edges to see the strongest
          similarity links.
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

      <div className="relative flex-1 overflow-hidden rounded-3xl border border-[var(--line)] bg-white/55 shadow-[0_20px_60px_-30px_rgba(40,70,120,0.35)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(90,120,180,0.16) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <svg ref={svgRef} width={size.w} height={size.h} className="relative z-10">
          {showEdges &&
            edges.map((e) => {
              const a = byId[e.source];
              const b = byId[e.target];
              if (!a || !b) return null;
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
            const dim = hovered && hovered !== n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.px}, ${n.py})`}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/forms/${n.slug}`)}
                opacity={dim ? 0.35 : 1}
                style={{ transition: "opacity 200ms ease" }}
              >
                <circle
                  r={hovered === n.id ? 18 : 14}
                  fill={palette[i % palette.length]}
                  stroke="white"
                  strokeWidth={3}
                  style={{
                    filter: "drop-shadow(0 8px 16px rgba(40,70,120,0.25))",
                    transition: "r 180ms ease",
                  }}
                />
                <text
                  y={32}
                  textAnchor="middle"
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
