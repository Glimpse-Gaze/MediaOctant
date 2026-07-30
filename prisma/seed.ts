import { PrismaClient } from "@prisma/client";
import { FORMS } from "./seed-data";
import { TRAITS } from "./traits";

const prisma = new PrismaClient();

async function main() {
  await prisma.mediaExample.deleteMany();
  await prisma.mediaFormTag.deleteMany();
  await prisma.freeformTrait.deleteMany();
  await prisma.fixedTraitValue.deleteMany();
  await prisma.mediaForm.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.traitDefinition.deleteMany();

  const traits = [];
  for (const t of TRAITS) {
    traits.push(
      await prisma.traitDefinition.create({
        data: {
          code: t.code,
          name: t.name,
          minValue: 0,
          maxValue: 10,
          sortOrder: t.sortOrder,
        },
      }),
    );
  }
  const byCode = Object.fromEntries(traits.map((t) => [t.code, t]));

  const tagByName = new Map<string, { id: string; slug: string }>();

  async function ensureTag(name: string) {
    const existing = tagByName.get(name);
    if (existing) return existing;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const tag = await prisma.tag.create({ data: { name, slug } });
    const entry = { id: tag.id, slug: tag.slug };
    tagByName.set(name, entry);
    return entry;
  }

  for (const form of FORMS) {
    const created = await prisma.mediaForm.create({
      data: {
        name: form.name,
        slug: form.slug,
        description: form.description,
        fixedTraits: {
          create: TRAITS.map((t) => ({
            traitId: byCode[t.code].id,
            value: form.scores[t.code],
            rationale: form.rationales[t.code] ?? "",
          })),
        },
        freeformTraits: form.freeform
          ? {
              create: form.freeform.map((f) => ({
                nameDisplay: f.name,
                valueDisplay: f.value,
                nameNormalized: f.name.toLowerCase(),
                valueNormalized: f.value.toLowerCase(),
              })),
            }
          : undefined,
      },
    });

    if (form.tags?.length) {
      for (const tagName of form.tags) {
        const tag = await ensureTag(tagName);
        await prisma.mediaFormTag.create({
          data: { formId: created.id, tagId: tag.id },
        });
      }
    }
  }

  // Legacy demo tag links for reference forms without explicit tags
  const japan = await ensureTag("Japan");
  const performance = await ensureTag("performance");
  const visualArt = await ensureTag("visual-art");
  const cinema = await ensureTag("cinema");

  const legacyLinks: Array<{ slug: string; tags: string[] }> = [
    { slug: "opera", tags: ["performance"] },
    { slug: "shadow-play", tags: ["performance"] },
    { slug: "sculpture", tags: ["visual-art"] },
    { slug: "ukiyo-e-averaged", tags: ["Japan", "visual-art"] },
    { slug: "kabuki-theatre", tags: ["Japan", "performance"] },
    { slug: "tachi-e-kamishibai", tags: ["Japan", "performance"] },
    { slug: "hira-e-kamishibai", tags: ["Japan", "performance"] },
  ];

  const tagLookup = Object.fromEntries(
    [...tagByName.entries()].map(([name, tag]) => [name, tag.id]),
  );
  tagLookup.Japan = japan.id;
  tagLookup.performance = performance.id;
  tagLookup["visual-art"] = visualArt.id;
  tagLookup.cinema = cinema.id;

  for (const { slug, tags } of legacyLinks) {
    const form = await prisma.mediaForm.findUniqueOrThrow({ where: { slug } });
    const existing = await prisma.mediaFormTag.findMany({ where: { formId: form.id } });
    if (existing.length > 0) continue;
    for (const tagName of tags) {
      await prisma.mediaFormTag.create({
        data: { formId: form.id, tagId: tagLookup[tagName] },
      });
    }
  }

  console.log(`Seeded ${TRAITS.length} traits and ${FORMS.length} media forms.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
