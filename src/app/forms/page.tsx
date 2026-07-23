import Link from "next/link";
import { listForms } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const forms = await listForms();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1
        className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight"
        style={{ letterSpacing: "-0.03em" }}
      >
        Browse forms
      </h1>
      <p className="mt-2 text-[var(--muted)]">
        {forms.length} media form{forms.length === 1 ? "" : "s"} in the atlas
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <li key={form.id}>
            <Link
              href={`/forms/${form.slug}`}
              className="block rounded-2xl border border-[var(--line)] bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
                {form.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {form._count.freeformTraits} freeform · {form._count.examples} examples
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
