"use client";

import { useId, useMemo } from "react";
import type { TraitMeta } from "@/lib/octant-viz";
import { traitUnit } from "@/lib/octant-viz";

type Props = {
  traits: TraitMeta[];
  values: Record<string, number>;
  size?: number;
};

export function TraitRadar({ traits, values, size = 220 }: Props) {
  const gradId = useId().replace(/:/g, "");
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const n = traits.length;

  const points = useMemo(() => {
    return traits.map((t, i) => {
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const u = traitUnit(values[t.code] ?? 0, t);
      return {
        code: t.code,
        angle,
        u,
        x: cx + Math.cos(angle) * radius * u,
        y: cy + Math.sin(angle) * radius * u,
        lx: cx + Math.cos(angle) * (radius + 18),
        ly: cy + Math.sin(angle) * (radius + 18),
      };
    });
  }, [traits, values, cx, cy, radius, n]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block"
      role="img"
      aria-label="Trait radar chart"
    >
      <defs>
        <linearGradient id={`radar-fill-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c5c5" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#7b6cff" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {rings.map((r) => (
        <polygon
          key={r}
          fill="none"
          stroke="rgba(90,120,180,0.18)"
          strokeWidth={1}
          points={traits
            .map((_, i) => {
              const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
              return `${cx + Math.cos(angle) * radius * r},${cy + Math.sin(angle) * radius * r}`;
            })
            .join(" ")}
        />
      ))}

      {traits.map((_, i) => {
        const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * radius}
            y2={cy + Math.sin(angle) * radius}
            stroke="rgba(90,120,180,0.2)"
            strokeWidth={1}
          />
        );
      })}

      <polygon
        points={polygon}
        fill={`url(#radar-fill-${gradId})`}
        stroke="#7b6cff"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {points.map((p) => (
        <circle key={p.code} cx={p.x} cy={p.y} r={3.5} fill="#ff7a59" stroke="white" strokeWidth={1.5} />
      ))}

      {points.map((p) => (
        <text
          key={`label-${p.code}`}
          x={p.lx}
          y={p.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 11,
            fontWeight: 700,
            fill: "var(--ink)",
          }}
        >
          {p.code}
        </text>
      ))}
    </svg>
  );
}
