import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormBySlug, getFormsForSimilarity } from "@/lib/forms";
import { isAdminAuthenticated } from "@/lib/auth";
import { nearestNeighbors } from "@/lib/similarity";
import { TraitBars } from "@/components/TraitBars";
import { ExampleGallery } from "@/components/ExampleGallery";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function FormDetailPage({ params }: Props) {
  const { slug } = await params;
  const form = await getFormBySlug(slug);
  if (!form) notFound();

  const all = await getFormsForSimilarity();
  const neighbors = nearestNeighbors(form.id, all, 5);
  const admin = await isAdminAuthenticated();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm font-semibold text-[var(--violet)]">
            ← Back to Octant
          </Link>
          <h1
            className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            {form.name}
          </h1>
          {form.description ? (
            <p className="mt-3 max-w-2xl text-[var(--muted)]">{form.description}</p>
          ) : null}
          {form.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.tags.map((link) => (
                <Link
                  key={link.tag.id}
                  href={`/forms?tags=${encodeURIComponent(link.tag.slug)}`}
                  className="rounded-full bg-gradient-to-r from-[#e8fff6] to-[#e8eeff] px-3 py-1 text-sm font-semibold transition hover:opacity-80"
                >
                  {link.tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {admin ? (
          <Link
            href={`/admin/forms/${form.id}`}
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            Edit
          </Link>
        ) : null}
      </div>

      <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Fixed traits
        </h2>
        <TraitBars
          traits={form.fixedTraits.map((v) => ({
            code: v.trait.code,
            name: v.trait.name,
            value: v.value,
            max: v.trait.maxValue,
            rationale: v.rationale,
          }))}
        />
      </section>

      {form.freeformTraits.length > 0 ? (
        <section className="mt-5 rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Freeform traits
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {form.freeformTraits.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-gradient-to-r from-[#e8fff6] to-[#e8eeff] px-3 py-1 text-sm font-semibold"
              >
                {t.nameDisplay}: {t.valueDisplay}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Examples
        </h2>
        <ExampleGallery examples={form.examples} />
      </section>

      <section className="mt-5 rounded-3xl border border-[var(--line)] bg-white/70 p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Nearest neighbors
        </h2>
        <ul className="mt-3 space-y-2">
          {neighbors.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 text-sm">
              <Link href={`/forms/${n.slug}`} className="font-semibold hover:text-[var(--violet)]">
                {n.name}
              </Link>
              <span className="tabular-nums text-[var(--muted)]">
                {(n.similarity * 100).toFixed(0)}% similar
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
