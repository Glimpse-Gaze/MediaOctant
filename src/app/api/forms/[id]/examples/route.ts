import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const urlExampleSchema = z.object({
  kind: z.enum(["image", "video"]),
  url: z.string().url(),
  caption: z.string().optional().default(""),
});

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: formId } = await ctx.params;
  const form = await prisma.mediaForm.findUnique({ where: { id: formId } });
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "image");
    const caption = String(formData.get("caption") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (kind !== "image" && kind !== "video") {
      return NextResponse.json({ error: "kind must be image or video" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const dir = path.join(process.cwd(), "public", "uploads", formId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    const storagePath = `/uploads/${formId}/${filename}`;
    const example = await prisma.mediaExample.create({
      data: {
        formId,
        kind,
        storagePath,
        caption,
      },
    });
    return NextResponse.json({ example }, { status: 201 });
  }

  const parsed = urlExampleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const example = await prisma.mediaExample.create({
    data: {
      formId,
      kind: parsed.data.kind,
      url: parsed.data.url,
      caption: parsed.data.caption,
    },
  });
  return NextResponse.json({ example }, { status: 201 });
}

export async function DELETE(request: Request, ctx: Ctx) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: formId } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const exampleId = searchParams.get("exampleId");
  if (!exampleId) {
    return NextResponse.json({ error: "exampleId required" }, { status: 400 });
  }

  const example = await prisma.mediaExample.findFirst({
    where: { id: exampleId, formId },
  });
  if (!example) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.mediaExample.delete({ where: { id: exampleId } });
  return NextResponse.json({ ok: true });
}
