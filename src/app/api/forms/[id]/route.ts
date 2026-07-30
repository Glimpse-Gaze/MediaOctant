import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeSlug, normalizeTraitText } from "@/lib/normalize";
import { setFormTags, pruneUnusedTags } from "@/lib/tags";

const freeformSchema = z.object({
  nameDisplay: z.string().min(1),
  valueDisplay: z.string().min(1),
});

const fixedTraitSchema = z.union([
  z.number().min(0).max(10),
  z.object({
    value: z.number().min(0).max(10),
    description: z.string().optional().default(""),
  }),
]);

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  slug: z.string().optional(),
  fixedTraits: z.record(z.string(), fixedTraitSchema),
  freeformTraits: z.array(freeformSchema).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

function parseFixedTrait(input: z.infer<typeof fixedTraitSchema>) {
  if (typeof input === "number") {
    return { value: input, description: "" };
  }
  return { value: input.value, description: input.description ?? "" };
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const form = await prisma.mediaForm.findUnique({
    where: { id },
    include: {
      fixedTraits: { include: { trait: true } },
      freeformTraits: true,
      examples: { orderBy: { sortOrder: "asc" } },
      tags: { include: { tag: true }, orderBy: { tag: { name: "asc" } } },
    },
  });
  if (!form) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ form });
}

export async function PUT(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const parsed = formSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || makeSlug(data.name);
  const traits = await prisma.traitDefinition.findMany();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.mediaForm.update({
        where: { id },
        data: {
          name: data.name.trim(),
          slug,
          description: data.description ?? "",
        },
      });

      for (const t of traits) {
        const parsed = parseFixedTrait(data.fixedTraits[t.code] ?? 0);
        await tx.fixedTraitValue.upsert({
          where: { formId_traitId: { formId: id, traitId: t.id } },
          create: {
            formId: id,
            traitId: t.id,
            value: parsed.value,
            description: parsed.description,
          },
          update: { value: parsed.value, description: parsed.description },
        });
      }

      await tx.freeformTrait.deleteMany({ where: { formId: id } });
      if (data.freeformTraits.length) {
        await tx.freeformTrait.createMany({
          data: data.freeformTraits.map((t) => ({
            formId: id,
            nameDisplay: t.nameDisplay.trim(),
            valueDisplay: t.valueDisplay.trim(),
            nameNormalized: normalizeTraitText(t.nameDisplay),
            valueNormalized: normalizeTraitText(t.valueDisplay),
          })),
        });
      }

      await setFormTags(id, data.tags, tx);
    });

    const form = await prisma.mediaForm.findUnique({ where: { id } });
    return NextResponse.json({ form });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await prisma.mediaForm.delete({ where: { id } });
  await pruneUnusedTags();
  return NextResponse.json({ ok: true });
}
