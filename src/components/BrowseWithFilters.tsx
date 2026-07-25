"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { TagFilterPanel, useTagFilter } from "@/components/TagFilterPanel";
import { formMatchesTags, type FormTag, type TagSummary } from "@/lib/tags";

type BrowseForm = {
  id: string;
  name: string;
  slug: string;
  tags: FormTag[];
  freeformCount: number;
  exampleCount: number;
};

function BrowseWithFiltersInner({
  forms,
  tags,
}: {
  forms: BrowseForm[];
  tags: TagSummary[];
}) {
  const { selected, mode, toggleTag, setMode, clear } = useTagFilter(tags);

  const filtered = useMemo(() => {
    if (!selected.length) return forms;
    return forms.filter((f) =>
      formMatchesTags(
        f.tags.map((t) => t.slug),
        selected,
        mode,
      ),
    );
  }, [forms, mode, selected]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1
        className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight"
        style={{ letterSpacing: "-0.03em" }}
      >
        Browse forms
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        {forms.length} media form{forms.length === 1 ? "" : "s"} in the Octant
      </p>

      <div className="mt-6">
        <TagFilterPanel
          tags={tags}
          selected={selected}
          mode={mode}
          onToggle={toggleTag}
          onModeChange={setMode}
          onClear={clear}
          matchedCount={filtered.length}
          totalCount={forms.length}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-6 text-center text-sm text-[var(--muted)]">
          No forms match the selected tags.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <li key={form.id} className="min-h-0">
              <Link
                href={`/forms/${form.slug}`}
                className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                  {form.name}
                </h2>
                <div className="mt-2 flex min-h-[1.5rem] flex-wrap gap-1.5">
                  {form.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-[#eef3fb] px-2 py-0.5 text-xs font-semibold text-[var(--muted)]"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                <p className="mt-auto pt-2 text-sm text-[var(--muted)]">
                  {form.freeformCount} freeform · {form.exampleCount} examples
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BrowseWithFilters(props: { forms: BrowseForm[]; tags: TagSummary[] }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <BrowseWithFiltersInner {...props} />
    </Suspense>
  );
}
