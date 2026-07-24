import { BrowseWithFilters } from "@/components/BrowseWithFilters";
import { listForms } from "@/lib/forms";
import { listTagsWithCounts } from "@/lib/tags";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const [forms, tags] = await Promise.all([listForms(), listTagsWithCounts()]);

  return (
    <BrowseWithFilters
      forms={forms.map((form) => ({
        id: form.id,
        name: form.name,
        slug: form.slug,
        tags: form.tags.map((l) => ({
          id: l.tag.id,
          name: l.tag.name,
          slug: l.tag.slug,
        })),
        freeformCount: form._count.freeformTraits,
        exampleCount: form._count.examples,
      }))}
      tags={tags}
    />
  );
}
