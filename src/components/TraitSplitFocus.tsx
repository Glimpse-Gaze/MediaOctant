"use client";

import { useState } from "react";

export type TraitSplitItem = {
  code: string;
  name: string;
  value: number;
  max: number;
  note?: string;
};

const COLORS = [
  "#22c5c5",
  "#7b6cff",
  "#ff7a59",
  "#7ce38b",
  "#ffd166",
  "#5b8def",
  "#ff8fab",
  "#4dd0c6",
];

function tint(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function TraitSplitFocus({ traits }: { traits: TraitSplitItem[] }) {
  const [selectedCode, setSelectedCode] = useState(traits[0]?.code ?? "");
  const selected =
    traits.find((t) => t.code === selectedCode) ?? traits[0] ?? null;
  const selectedIndex = selected
    ? Math.max(0, traits.findIndex((t) => t.code === selected.code))
    : 0;
  const color = COLORS[selectedIndex % COLORS.length];
  const note = selected?.note?.trim();

  if (!traits.length || !selected) {
    return (
      <p className="mt-4 text-sm text-[var(--muted)]">No fixed traits yet.</p>
    );
  }

  return (
    <div className="mt-4 flex flex-col md:flex-row md:gap-0">
      <div className="border-[var(--line)] md:w-[42%] md:shrink-0 md:border-r">
        <p className="px-1 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)] md:sr-only">
          Traits
        </p>
        <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)] md:rounded-none md:border-0">
          {traits.map((t, i) => {
            const isSelected = t.code === selected.code;
            const c = COLORS[i % COLORS.length];
            const pct = Math.max(0, Math.min(100, (t.value / t.max) * 100));
            return (
              <li key={t.code}>
                <button
                  type="button"
                  onClick={() => setSelectedCode(t.code)}
                  aria-pressed={isSelected}
                  className="relative flex w-full items-center gap-2.5 px-3 py-3 text-left transition hover:bg-[#f7faff] md:px-2"
                  style={{
                    background: isSelected ? tint(c, 0.1) : undefined,
                  }}
                >
                  {isSelected ? (
                    <span
                      className="absolute inset-y-0 left-0 w-1 rounded-r-full"
                      style={{ background: c }}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className="inline-flex min-w-[2.6rem] items-center justify-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide"
                    style={{
                      borderColor: c,
                      color: c,
                      background: isSelected ? tint(c, 0.12) : "white",
                    }}
                  >
                    {t.code}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 block truncate text-xs font-semibold text-[var(--ink)]">
                      {t.name}
                    </span>
                    <span className="block h-1.5 overflow-hidden rounded-full bg-[#eef3fb]">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${pct}%`, background: c }}
                      />
                    </span>
                  </span>
                  <span
                    className="shrink-0 tabular-nums text-sm font-semibold"
                    style={{ color: isSelected ? c : "var(--muted)" }}
                  >
                    {t.value}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex min-h-[220px] flex-1 flex-col md:mt-0 md:px-6 md:pl-7">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          {selected.code}
        </p>
        <h3
          className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight"
          style={{ letterSpacing: "-0.03em" }}
        >
          {selected.name}
        </h3>
        <p
          className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {selected.value}
        </p>
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          {note ? (
            <p className="text-base leading-relaxed text-[var(--muted)]">{note}</p>
          ) : (
            <p className="text-base italic text-[var(--muted)]">
              No rationale recorded for this score yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
