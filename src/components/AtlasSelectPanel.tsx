"use client";

import Link from "next/link";
import { TraitBars } from "@/components/TraitBars";
import { TraitRadar } from "@/components/TraitRadar";
import type { TraitMeta } from "@/lib/atlas-viz";
import type { FormTag } from "@/lib/tags";
import { buildFilterQuery } from "@/lib/tags";

export type AtlasPanelForm = {
  id: string;
  name: string;
  slug: string;
  tags: FormTag[];
  fixed: Record<string, number>;
};

export function AtlasSelectPanel({
  form,
  traits,
  onClose,
  eyebrow = "Selected",
}: {
  form: AtlasPanelForm;
  traits: TraitMeta[];
  onClose: () => void;
  eyebrow?: string;
}) {
  return (
    <aside
      className="flex h-full min-h-[520px] w-full flex-col rounded-3xl border border-[var(--line)] bg-white/80 p-5 shadow-sm sm:min-w-[280px] lg:w-[300px] lg:shrink-0"
      aria-label={`${eyebrow}: ${form.name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--violet)]">
            {eyebrow}
          </p>
          <h2
            className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            {form.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-full border border-[var(--line)] bg-white px-2.5 py-1 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          ×
        </button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <h3 className="font-[family-name:var(--font-display)] text-sm font-bold">
          Trait profile
        </h3>
        <div className="mt-2 rounded-2xl bg-[#f7faff] px-1 py-2">
          <TraitRadar traits={traits} values={form.fixed} size={240} />
        </div>
        <h3 className="mt-4 font-[family-name:var(--font-display)] text-sm font-bold">
          Fixed traits
        </h3>
        <TraitBars
          traits={traits.map((t) => ({
            code: t.code,
            name: t.name,
            value: form.fixed[t.code] ?? 0,
            max: t.maxValue,
          }))}
        />
      </div>

      <div className="mt-4 min-h-[3.25rem]">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
          Tags
        </p>
        {form.tags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {form.tags.map((t) => (
              <Link
                key={t.id}
                href={`/forms${buildFilterQuery([t.slug], "or")}`}
                className="rounded-full bg-gradient-to-r from-[#e8fff6] to-[#e8eeff] px-2.5 py-0.5 text-xs font-semibold transition hover:opacity-80"
              >
                {t.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-xs text-[var(--muted)]">No tags</p>
        )}
      </div>

      <Link
        href={`/forms/${form.slug}`}
        className="mt-3 inline-flex items-center justify-center rounded-full bg-[var(--ink)] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
      >
        Open detail
      </Link>
    </aside>
  );
}
