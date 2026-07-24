import { prisma } from "@/lib/prisma";
import type { FormForSimilarity } from "@/lib/similarity";
import type { FormTag } from "@/lib/tags";

const tagInclude = {
  tags: {
    include: { tag: true },
    orderBy: { tag: { name: "asc" as const } },
  },
};

function mapFormTags(
  links: Array<{ tag: { id: string; name: string; slug: string } }>,
): FormTag[] {
  return links.map((l) => ({
    id: l.tag.id,
    name: l.tag.name,
    slug: l.tag.slug,
  }));
}

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

export async function getFormsForAtlas() {
  const forms = await prisma.mediaForm.findMany({
    include: {
      fixedTraits: { include: { trait: true } },
      freeformTraits: true,
      ...tagInclude,
    },
    orderBy: { name: "asc" },
  });

  return forms.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    tags: mapFormTags(f.tags),
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
      ...tagInclude,
    },
  });
}

export async function listForms() {
  return prisma.mediaForm.findMany({
    orderBy: { name: "asc" },
    include: {
      fixedTraits: { include: { trait: true } },
      _count: { select: { freeformTraits: true, examples: true } },
      ...tagInclude,
    },
  });
}

export { mapFormTags };
