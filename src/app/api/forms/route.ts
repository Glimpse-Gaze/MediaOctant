import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { makeSlug, normalizeTraitText } from "@/lib/normalize";
import { listForms } from "@/lib/forms";
import { setFormTags } from "@/lib/tags";

const freeformSchema = z.object({
  nameDisplay: z.string().min(1),
  valueDisplay: z.string().min(1),
});

const fixedTraitSchema = z.union([
  z.number().min(0).max(10),
  z.object({
    value: z.number().min(0).max(10),
    rationale: z.string().optional().default(""),
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
    return { value: input, rationale: "" };
  }
  return { value: input.value, rationale: input.rationale ?? "" };
}

export async function GET() {
  const forms = await listForms();
  return NextResponse.json({ forms });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = formSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug?.trim() || makeSlug(data.name);
  const traits = await prisma.traitDefinition.findMany();

  try {
    const form = await prisma.$transaction(async (tx) => {
      const created = await tx.mediaForm.create({
        data: {
          name: data.name.trim(),
          slug,
          description: data.description ?? "",
          fixedTraits: {
            create: traits.map((t) => {
              const parsed = parseFixedTrait(data.fixedTraits[t.code] ?? 0);
              return {
                traitId: t.id,
                value: parsed.value,
                rationale: parsed.rationale,
              };
            }),
          },
          freeformTraits: {
            create: data.freeformTraits.map((t) => ({
              nameDisplay: t.nameDisplay.trim(),
              valueDisplay: t.valueDisplay.trim(),
              nameNormalized: normalizeTraitText(t.nameDisplay),
              valueNormalized: normalizeTraitText(t.valueDisplay),
            })),
          },
        },
      });
      await setFormTags(created.id, data.tags, tx);
      return created;
    });
    return NextResponse.json({ form }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
