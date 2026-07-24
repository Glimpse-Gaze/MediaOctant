"use client";

import { Suspense, useMemo } from "react";
import { AtlasCanvas } from "@/components/AtlasCanvas";
import { TagFilterPanel, useTagFilter } from "@/components/TagFilterPanel";
import type { AtlasEdge, AtlasNode } from "@/lib/similarity";
import { formMatchesTags, type FormTag, type TagSummary } from "@/lib/tags";

type FormMeta = {
  id: string;
  tags: FormTag[];
};

function AtlasWithFiltersInner({
  nodes,
  edges,
  forms,
  tags,
}: {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  forms: FormMeta[];
  tags: TagSummary[];
}) {
  const { selected, mode, toggleTag, setMode, clear } = useTagFilter(tags);

  const tagsByFormId = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const f of forms) {
      map.set(
        f.id,
        f.tags.map((t) => t.slug),
      );
    }
    return map;
  }, [forms]);

  const visibleIds = useMemo(() => {
    if (!selected.length) return null;
    const ids = new Set<string>();
    for (const f of forms) {
      if (formMatchesTags(tagsByFormId.get(f.id) ?? [], selected, mode)) {
        ids.add(f.id);
      }
    }
    return ids;
  }, [forms, mode, selected, tagsByFormId]);

  const matchedCount = visibleIds ? visibleIds.size : forms.length;

  return (
    <div className="flex flex-col gap-4">
      <TagFilterPanel
        tags={tags}
        selected={selected}
        mode={mode}
        onToggle={toggleTag}
        onModeChange={setMode}
        onClear={clear}
        matchedCount={matchedCount}
        totalCount={forms.length}
      />
      <AtlasCanvas nodes={nodes} edges={edges} visibleIds={visibleIds} />
    </div>
  );
}

export function AtlasWithFilters(props: {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  forms: FormMeta[];
  tags: TagSummary[];
}) {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-[var(--line)] bg-white/70 p-4 text-sm text-[var(--muted)]">
          Loading filters…
        </div>
      }
    >
      <AtlasWithFiltersInner {...props} />
    </Suspense>
  );
}
