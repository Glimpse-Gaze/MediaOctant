import { AtlasWithFilters } from "@/components/AtlasWithFilters";
import { getFormsForAtlas } from "@/lib/forms";
import { layoutAtlas } from "@/lib/similarity";
import { listTagsWithCounts } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [forms, tags] = await Promise.all([getFormsForAtlas(), listTagsWithCounts()]);
  const { nodes, edges } = layoutAtlas(forms);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="max-w-2xl">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[var(--violet)]">
          Explore
        </p>
        <h1
          className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight md:text-5xl"
          style={{ letterSpacing: "-0.04em" }}
        >
          A playful map of media forms
        </h1>
        <p className="mt-3 text-base text-[var(--muted)] md:text-lg">
          Proximity comes from shared trait profiles — visual, auditory, liveness, and more.
          Use tags below to filter the map without changing layout.
        </p>
      </section>

      <AtlasWithFilters
        nodes={nodes}
        edges={edges}
        forms={forms.map((f) => ({ id: f.id, tags: f.tags }))}
        tags={tags}
      />
    </div>
  );
}
