import { PrismaClient } from "@prisma/client";
import { RATED_FORMS, type SeedForm } from "./seed-data";
import { TRAITS } from "./traits";

const prisma = new PrismaClient();

async function ensureTraits() {
  const byCode: Record<string, { id: string }> = {};
  for (const t of TRAITS) {
    const trait = await prisma.traitDefinition.upsert({
      where: { code: t.code },
      create: {
        code: t.code,
        name: t.name,
        minValue: 0,
        maxValue: 10,
        sortOrder: t.sortOrder,
      },
      update: {
        name: t.name,
        sortOrder: t.sortOrder,
      },
    });
    byCode[t.code] = trait;
  }
  return byCode;
}

async function ensureTag(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return prisma.tag.upsert({
    where: { slug },
    create: { name, slug },
    update: { name },
  });
}

async function upsertForm(form: SeedForm, byCode: Record<string, { id: string }>) {
  const saved = await prisma.mediaForm.upsert({
    where: { slug: form.slug },
    create: {
      name: form.name,
      slug: form.slug,
      description: form.description,
    },
    update: {
      name: form.name,
      description: form.description,
    },
  });

  for (const t of TRAITS) {
    await prisma.fixedTraitValue.upsert({
      where: { formId_traitId: { formId: saved.id, traitId: byCode[t.code].id } },
      create: {
        formId: saved.id,
        traitId: byCode[t.code].id,
        value: form.scores[t.code],
        description: form.descriptions[t.code] ?? "",
      },
      update: {
        value: form.scores[t.code],
        description: form.descriptions[t.code] ?? "",
      },
    });
  }

  if (form.tags?.length) {
    for (const tagName of form.tags) {
      const tag = await ensureTag(tagName);
      await prisma.mediaFormTag.upsert({
        where: { formId_tagId: { formId: saved.id, tagId: tag.id } },
        create: { formId: saved.id, tagId: tag.id },
        update: {},
      });
    }
  }

  if (form.freeform?.length) {
    await prisma.freeformTrait.deleteMany({ where: { formId: saved.id } });
    await prisma.freeformTrait.createMany({
      data: form.freeform.map((f) => ({
        formId: saved.id,
        nameDisplay: f.name,
        valueDisplay: f.value,
        nameNormalized: f.name.toLowerCase(),
        valueNormalized: f.value.toLowerCase(),
      })),
    });
  }

  return saved;
}

async function main() {
  if (!process.env.DATABASE_URL?.startsWith("postgres")) {
    throw new Error(
      "DATABASE_URL must point at PostgreSQL (postgres:// or postgresql://). Refusing to run rated-form upsert against a non-Postgres database.",
    );
  }

  const byCode = await ensureTraits();

  for (const form of RATED_FORMS) {
    await upsertForm(form, byCode);
  }

  console.log(`Upserted ${RATED_FORMS.length} rated media forms into PostgreSQL.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
