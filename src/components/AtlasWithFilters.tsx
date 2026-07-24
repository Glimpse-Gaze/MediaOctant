"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { AtlasCanvas } from "@/components/AtlasCanvas";
import { AtlasSelectPanel, type AtlasPanelForm } from "@/components/AtlasSelectPanel";
import { AtlasToast } from "@/components/AtlasToast";
import { AtlasViewControls } from "@/components/AtlasViewControls";
import { TagFilterPanel, useTagFilter } from "@/components/TagFilterPanel";
import type { AtlasViewMode, TraitMeta } from "@/lib/atlas-viz";
import type { AtlasEdge, AtlasNode } from "@/lib/similarity";
import { formMatchesTags, type TagSummary } from "@/lib/tags";

type FormMeta = AtlasPanelForm;

const MAX_COMPARE = 2;

function AtlasWithFiltersInner({
  nodes,
  edges,
  forms,
  tags,
  traits,
}: {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  forms: FormMeta[];
  tags: TagSummary[];
  traits: TraitMeta[];
}) {
  const { selected, mode, toggleTag, setMode, clear } = useTagFilter(tags);
  const [viewMode, setViewMode] = useState<AtlasViewMode>("default");
  const [traitCode, setTraitCode] = useState(traits[0]?.code ?? "VIS");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const encodeTrait = useMemo(() => {
    return traits.find((t) => t.code === traitCode) ?? traits[0] ?? {
      code: "VIS",
      name: "Visual Participation",
      minValue: 0,
      maxValue: 10,
    };
  }, [traits, traitCode]);

  const handleViewMode = useCallback(
    (next: AtlasViewMode) => {
      setViewMode(next);
      if ((next === "colorSize" || next === "heat") && !traits.some((t) => t.code === traitCode)) {
        setTraitCode(traits[0]?.code ?? "VIS");
      }
    },
    [traitCode, traits],
  );

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const handleNodeClick = useCallback(
    (id: string, additive: boolean) => {
      if (additive) {
        if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter((x) => x !== id));
          return;
        }
        if (selectedIds.length >= MAX_COMPARE) {
          setToast("You can select a maximum of two nodes currently.");
          return;
        }
        setSelectedIds([...selectedIds, id]);
        return;
      }
      setSelectedIds([id]);
    },
    [selectedIds],
  );

  const removeSelection = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  }, []);

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

  const formsById = useMemo(() => {
    return Object.fromEntries(forms.map((f) => [f.id, f]));
  }, [forms]);

  const fixedById = useMemo(() => {
    return Object.fromEntries(forms.map((f) => [f.id, f.fixed]));
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
  const panelForms = selectedIds
    .map((id) => formsById[id])
    .filter((f): f is FormMeta => Boolean(f));

  return (
    <div className="flex flex-col gap-4">
      <AtlasToast message={toast} onDismiss={dismissToast} />
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

      <AtlasViewControls
        mode={viewMode}
        onModeChange={handleViewMode}
        traits={traits}
        traitCode={encodeTrait.code}
        onTraitChange={setTraitCode}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="min-w-0 flex-1">
          <AtlasCanvas
            nodes={nodes}
            edges={edges}
            fixedById={fixedById}
            viewMode={viewMode}
            encodeTrait={encodeTrait}
            visibleIds={visibleIds}
            selectedIds={selectedIds}
            onClearSelection={clearSelection}
            onNodeClick={handleNodeClick}
            panelOpen={panelForms.length > 0}
          />
        </div>
        {panelForms.length > 0 ? (
          <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto lg:shrink-0">
            {panelForms.map((form, index) => (
              <AtlasSelectPanel
                key={form.id}
                form={form}
                traits={traits}
                eyebrow={
                  panelForms.length > 1 ? `Compare ${index + 1}` : "Selected"
                }
                onClose={() => removeSelection(form.id)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AtlasWithFilters(props: {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  forms: FormMeta[];
  tags: TagSummary[];
  traits: TraitMeta[];
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
