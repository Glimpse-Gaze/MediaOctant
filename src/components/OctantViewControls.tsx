"use client";

import type { OctantViewMode, TraitMeta } from "@/lib/octant-viz";
import { traitColor } from "@/lib/octant-viz";

export function OctantViewControls({
  mode,
  onModeChange,
  traits,
  traitCode,
  onTraitChange,
}: {
  mode: OctantViewMode;
  onModeChange: (mode: OctantViewMode) => void;
  traits: TraitMeta[];
  traitCode: string;
  onTraitChange: (code: string) => void;
}) {
  const showTraitPicker = mode === "colorSize" || mode === "heat";
  const modes: Array<{ id: OctantViewMode; label: string }> = [
    { id: "default", label: "Default" },
    { id: "colorSize", label: "Color & size" },
    { id: "heat", label: "Heat" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="inline-flex rounded-full border border-[var(--line)] bg-white/80 p-0.5 text-sm font-semibold shadow-sm"
        role="group"
        aria-label="Octant view mode"
      >
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onModeChange(m.id)}
            className={`rounded-full px-3 py-1.5 transition ${
              mode === m.id
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {showTraitPicker ? (
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]">
          Trait
          <select
            value={traitCode}
            onChange={(e) => onTraitChange(e.target.value)}
            className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 font-semibold text-[var(--ink)] outline-none ring-[var(--violet)] focus:ring-2"
          >
            {traits.map((t) => (
              <option key={t.code} value={t.code}>
                {t.code} · {t.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {showTraitPicker ? (
        <div
          className="hidden items-center gap-2 sm:flex"
          aria-hidden
          title="Trait scale"
        >
          <span className="text-xs font-semibold text-[var(--muted)]">Low</span>
          <div
            className="h-2.5 w-28 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${traitColor(0)}, ${traitColor(0.5)}, ${traitColor(1)})`,
            }}
          />
          <span className="text-xs font-semibold text-[var(--muted)]">High</span>
        </div>
      ) : null}
    </div>
  );
}
