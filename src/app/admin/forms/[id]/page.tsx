import { notFound, redirect } from "next/navigation";
import { FormEditor } from "@/components/FormEditor";
import { isAdminAuthenticated } from "@/lib/auth";
import { getTraitDefinitions } from "@/lib/forms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditFormPage({ params }: Props) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const { id } = await params;

  const [traits, form] = await Promise.all([
    getTraitDefinitions(),
    prisma.mediaForm.findUnique({
      where: { id },
      include: {
        fixedTraits: { include: { trait: true } },
        freeformTraits: true,
        examples: { orderBy: { sortOrder: "asc" } },
        tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
      },
    }),
  ]);

  if (!form) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
        Edit {form.name}
      </h1>
      <FormEditor
        key={form.id}
        traits={traits}
        initial={{
          id: form.id,
          name: form.name,
          slug: form.slug,
          description: form.description,
          fixedTraits: Object.fromEntries(
            form.fixedTraits.map((v) => [v.trait.code, v.value]),
          ),
          freeformTraits: form.freeformTraits.map((t) => ({
            nameDisplay: t.nameDisplay,
            valueDisplay: t.valueDisplay,
          })),
          tags: form.tags.map((l) => l.tag.name),
          examples: form.examples,
        }}
      />
    </div>
  );
}
