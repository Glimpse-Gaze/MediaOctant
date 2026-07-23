import { prisma } from "@/lib/prisma";
import type { FormForSimilarity } from "@/lib/similarity";

export async function getTraitDefinitions() {
  return prisma.traitDefinition.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getFormsForSimilarity(): Promise<FormForSimilarity[]> {
  const forms = await prisma.mediaForm.findMany({
    include: {
      fixedTraits: { include: { trait: true } },
      freeformTraits: true,
    },
    orderBy: { name: "asc" },
  });

  return forms.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    fixed: Object.fromEntries(f.fixedTraits.map((v) => [v.trait.code, v.value])),
    freeform: f.freeformTraits.map((t) => ({
      nameNormalized: t.nameNormalized,
      valueNormalized: t.valueNormalized,
    })),
  }));
}

export async function getFormBySlug(slug: string) {
  return prisma.mediaForm.findUnique({
    where: { slug },
    include: {
      fixedTraits: { include: { trait: true }, orderBy: { trait: { sortOrder: "asc" } } },
      freeformTraits: { orderBy: { nameDisplay: "asc" } },
      examples: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function listForms() {
  return prisma.mediaForm.findMany({
    orderBy: { name: "asc" },
    include: {
      fixedTraits: { include: { trait: true } },
      _count: { select: { freeformTraits: true, examples: true } },
    },
  });
}
