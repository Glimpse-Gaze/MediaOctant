import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TRAITS = [
  { code: "VIS", name: "Visual Participation", sortOrder: 1 },
  { code: "AUD", name: "Auditory Participation", sortOrder: 2 },
  { code: "EMB", name: "Embodied Participation", sortOrder: 3 },
  { code: "LIV", name: "Liveness", sortOrder: 4 },
  { code: "SEM", name: "Semantic Code", sortOrder: 5 },
  { code: "MAT", name: "Perceived Materiality", sortOrder: 6 },
  { code: "RAU", name: "Representational Autonomy", sortOrder: 7 },
  { code: "TMP", name: "Temporal Structuring", sortOrder: 8 },
] as const;

/** Sample rows from reference/Media traits weighted.xlsx */
const FORMS: Array<{
  name: string;
  slug: string;
  scores: Record<(typeof TRAITS)[number]["code"], number>;
}> = [
  {
    name: "Opera",
    slug: "opera",
    scores: { VIS: 8, AUD: 9.5, EMB: 1, LIV: 9.5, SEM: 6.5, MAT: 4, RAU: 3, TMP: 8.5 },
  },
  {
    name: "Radio",
    slug: "radio",
    scores: { VIS: 0, AUD: 10, EMB: 1, LIV: 6, SEM: 2, MAT: 0.5, RAU: 5, TMP: 9 },
  },
  {
    name: "Sculpture",
    slug: "sculpture",
    scores: { VIS: 9.5, AUD: 0, EMB: 1.5, LIV: 1, SEM: 9.5, MAT: 10, RAU: 9.5, TMP: 1 },
  },
  {
    name: "Automata",
    slug: "automata",
    scores: { VIS: 8, AUD: 1.5, EMB: 3.5, LIV: 4, SEM: 8.5, MAT: 8.5, RAU: 7.5, TMP: 6 },
  },
  {
    name: "Shadow Play",
    slug: "shadow-play",
    scores: { VIS: 8.5, AUD: 5.5, EMB: 1, LIV: 8, SEM: 7.5, MAT: 4.5, RAU: 3, TMP: 6.5 },
  },
  {
    name: "Tachi-e Kamishibai",
    slug: "tachi-e-kamishibai",
    scores: { VIS: 9, AUD: 7, EMB: 1.5, LIV: 8, SEM: 7.5, MAT: 8, RAU: 3.5, TMP: 7.5 },
  },
  {
    name: "Hira-e Kamishibai",
    slug: "hira-e-kamishibai",
    scores: { VIS: 9, AUD: 7, EMB: 3, LIV: 6.5, SEM: 7, MAT: 8, RAU: 6.5, TMP: 9.5 },
  },
  {
    name: "Kabuki Theatre",
    slug: "kabuki-theatre",
    scores: { VIS: 8.5, AUD: 8, EMB: 1, LIV: 9.5, SEM: 8, MAT: 4.5, RAU: 3, TMP: 7.5 },
  },
  {
    name: "Ukiyo-e (averaged)",
    slug: "ukiyo-e-averaged",
    scores: { VIS: 9, AUD: 0, EMB: 4, LIV: 1, SEM: 8, MAT: 10, RAU: 6, TMP: 3 },
  },
];

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

  for (const form of FORMS) {
    await prisma.mediaForm.create({
      data: {
        name: form.name,
        slug: form.slug,
        description: "",
        fixedTraits: {
          create: TRAITS.map((t) => ({
            traitId: byCode[t.code].id,
            value: form.scores[t.code],
          })),
        },
      },
    });
  }

  // Demo freeform overlap: Japan on three forms so proximity bonus is visible
  const tachi = await prisma.mediaForm.findUniqueOrThrow({
    where: { slug: "tachi-e-kamishibai" },
  });
  const hira = await prisma.mediaForm.findUniqueOrThrow({
    where: { slug: "hira-e-kamishibai" },
  });
  const kabuki = await prisma.mediaForm.findUniqueOrThrow({
    where: { slug: "kabuki-theatre" },
  });
  const opera = await prisma.mediaForm.findUniqueOrThrow({ where: { slug: "opera" } });
  const sculpture = await prisma.mediaForm.findUniqueOrThrow({
    where: { slug: "sculpture" },
  });
  const ukiyoe = await prisma.mediaForm.findUniqueOrThrow({
    where: { slug: "ukiyo-e-averaged" },
  });
  const shadow = await prisma.mediaForm.findUniqueOrThrow({
    where: { slug: "shadow-play" },
  });

  for (const form of [tachi, hira, kabuki]) {
    await prisma.freeformTrait.create({
      data: {
        formId: form.id,
        nameDisplay: "Origin",
        valueDisplay: "Japan",
        nameNormalized: "origin",
        valueNormalized: "japan",
      },
    });
  }

  const japan = await prisma.tag.create({ data: { name: "Japan", slug: "japan" } });
  const performance = await prisma.tag.create({
    data: { name: "performance", slug: "performance" },
  });
  const visualArt = await prisma.tag.create({
    data: { name: "visual-art", slug: "visual-art" },
  });

  async function link(formId: string, tagId: string) {
    await prisma.mediaFormTag.create({ data: { formId, tagId } });
  }

  for (const form of [tachi, hira, kabuki, ukiyoe]) {
    await link(form.id, japan.id);
  }
  for (const form of [opera, kabuki, shadow, tachi, hira]) {
    await link(form.id, performance.id);
  }
  for (const form of [sculpture, ukiyoe]) {
    await link(form.id, visualArt.id);
  }

  console.log(
    `Seeded ${TRAITS.length} traits, ${FORMS.length} media forms, and 3 demo tags.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
