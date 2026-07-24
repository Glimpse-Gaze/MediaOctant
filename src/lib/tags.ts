import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { makeSlug, normalizeTraitText } from "@/lib/normalize";

export type TagFilterMode = "and" | "or";

export type TagSummary = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type FormTag = {
  id: string;
  name: string;
  slug: string;
};

type Db = PrismaClient | Prisma.TransactionClient;

/** Normalize tag text for matching; slug is URL-safe. */
export function normalizeTagName(input: string): string {
  return normalizeTraitText(input);
}

export function tagSlugFromName(input: string): string {
  return makeSlug(normalizeTagName(input));
}

export function formMatchesTags(
  formTagSlugs: string[],
  selectedSlugs: string[],
  mode: TagFilterMode,
): boolean {
  if (selectedSlugs.length === 0) return true;
  if (mode === "or") {
    return selectedSlugs.some((s) => formTagSlugs.includes(s));
  }
  return selectedSlugs.every((s) => formTagSlugs.includes(s));
}

export async function listTagsWithCounts(query?: string): Promise<TagSummary[]> {
  const q = query?.trim();
  const tags = await prisma.tag.findMany({
    where: {
      forms: { some: {} }, // hide orphans with no linked forms
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { slug: { contains: tagSlugFromName(q) } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { forms: true } } },
    orderBy: { name: "asc" },
  });

  return tags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    count: t._count.forms,
  }));
}

/** Delete tags that are no longer linked to any form. */
export async function pruneUnusedTags(db: Db = prisma) {
  await db.tag.deleteMany({
    where: { forms: { none: {} } },
  });
}

/** Upsert tags by name and replace a form's tag links. */
export async function setFormTags(formId: string, tagNames: string[], db: Db = prisma) {
  const bySlug = new Map<string, string>();
  for (const raw of tagNames) {
    const display = raw.trim();
    if (!display) continue;
    const slug = tagSlugFromName(display);
    if (!slug) continue;
    if (!bySlug.has(slug)) bySlug.set(slug, display);
  }

  await db.mediaFormTag.deleteMany({ where: { formId } });

  for (const [slug, display] of bySlug) {
    const tag = await db.tag.upsert({
      where: { slug },
      create: { slug, name: display },
      update: {},
    });
    await db.mediaFormTag.create({
      data: { formId, tagId: tag.id },
    });
  }

  await pruneUnusedTags(db);
}

export function parseTagsParam(value: string | null): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function parseModeParam(value: string | null): TagFilterMode {
  return value === "and" ? "and" : "or";
}

export function buildFilterQuery(tags: string[], mode: TagFilterMode): string {
  const params = new URLSearchParams();
  if (tags.length) params.set("tags", tags.join(","));
  if (mode === "and") params.set("mode", "and");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
