"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TagChipInput } from "@/components/TagFilterPanel";

type TraitDef = { id: string; code: string; name: string; minValue: number; maxValue: number };

type Example = {
  id: string;
  kind: string;
  url: string | null;
  storagePath: string | null;
  caption: string;
};

type Props = {
  traits: TraitDef[];
  initial?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    fixedTraits: Record<string, number>;
    traitRationales?: Record<string, string>;
    freeformTraits: Array<{ nameDisplay: string; valueDisplay: string }>;
    tags?: string[];
    examples: Example[];
  };
};

type FreeformRow = { nameDisplay: string; valueDisplay: string };
type FixedRow = { value: number; rationale: string };

function defaultFixed(traits: TraitDef[], initial?: Props["initial"]): Record<string, FixedRow> {
  return Object.fromEntries(
    traits.map((t) => [
      t.code,
      {
        value: initial?.fixedTraits?.[t.code] ?? 5,
        rationale: initial?.traitRationales?.[t.code] ?? "",
      },
    ]),
  );
}

export function FormEditor({ traits, initial }: Props) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fixed, setFixed] = useState<Record<string, FixedRow>>(() =>
    defaultFixed(traits, initial),
  );
  const [freeform, setFreeform] = useState<FreeformRow[]>(
    () => initial?.freeformTraits ?? [],
  );
  const [tags, setTags] = useState<string[]>(() => initial?.tags ?? []);
  const [examples, setExamples] = useState(initial?.examples ?? []);
  const [neighbors, setNeighbors] = useState<
    Array<{ id: string; name: string; slug: string; similarity: number }>
  >([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlKind, setUrlKind] = useState<"image" | "video">("image");
  const [urlValue, setUrlValue] = useState("");
  const [urlCaption, setUrlCaption] = useState("");

  const formId = initial?.id;

  // Reset when switching forms (key remount also covers create → edit).
  useEffect(() => {
    setName(initial?.name ?? "");
    setSlug(initial?.slug ?? "");
    setDescription(initial?.description ?? "");
    setFixed(defaultFixed(traits, initial));
    setFreeform(initial?.freeformTraits ?? []);
    setTags(initial?.tags ?? []);
    setExamples(initial?.examples ?? []);
    // Only when the edited form identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [formId]);

  useEffect(() => {
    if (!formId) return;
    fetch(`/api/octant?neighborsOf=${formId}`)
      .then((r) => r.json())
      .then((d) => setNeighbors(d.neighbors ?? []))
      .catch(() => {});
  }, [formId]);

  const payload = useMemo(
    () => ({
      name,
      slug: slug || undefined,
      description,
      fixedTraits: Object.fromEntries(
        traits.map((t) => [
          t.code,
          {
            value: fixed[t.code]?.value ?? 0,
            rationale: fixed[t.code]?.rationale ?? "",
          },
        ]),
      ),
      freeformTraits: freeform.filter((t) => t.nameDisplay.trim() && t.valueDisplay.trim()),
      tags,
    }),
    [name, slug, description, fixed, freeform, tags, traits],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(isEdit ? `/api/forms/${formId}` : "/api/forms", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Save failed");
      return;
    }
    router.push(`/admin/forms/${data.form.id}`);
    router.refresh();
  }

  async function addUrlExample() {
    if (!formId || !urlValue) return;
    const res = await fetch(`/api/forms/${formId}/examples`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: urlKind, url: urlValue, caption: urlCaption }),
    });
    if (!res.ok) {
      setError("Could not add URL example");
      return;
    }
    const data = await res.json();
    setExamples((prev) => [...prev, data.example]);
    setUrlValue("");
    setUrlCaption("");
  }

  async function uploadFile(file: File, kind: "image" | "video") {
    if (!formId) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    const res = await fetch(`/api/forms/${formId}/examples`, { method: "POST", body: fd });
    if (!res.ok) {
      setError("Upload failed");
      return;
    }
    const data = await res.json();
    setExamples((prev) => [...prev, data.example]);
  }

  async function removeExample(exampleId: string) {
    if (!formId) return;
    const res = await fetch(`/api/forms/${formId}/examples?exampleId=${exampleId}`, {
      method: "DELETE",
    });
    if (res.ok) setExamples((prev) => prev.filter((e) => e.id !== exampleId));
  }

  async function deleteForm() {
    if (!formId || !confirm("Delete this media form?")) return;
    await fetch(`/api/forms/${formId}`, { method: "DELETE" });
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold">
          Name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          />
        </label>
        <label className="block text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5">
            Slug
            <span className="group relative inline-flex">
              <button
                type="button"
                tabIndex={0}
                aria-label="What is a slug?"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[10px] font-bold leading-none text-[var(--muted)] hover:border-[var(--violet)] hover:text-[var(--violet)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--violet)]"
              >
                ?
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left text-xs font-normal leading-snug text-[var(--muted)] opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                URL-safe id for this form (e.g.{" "}
                <span className="font-semibold text-[var(--ink)]">/forms/opera</span>
                ). Auto-filled from the name if left blank; keep it unique.
              </span>
            </span>
          </span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto from name"
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>

      <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Tags</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Used for filtering on Octant and Browse. Type freely; existing tags autocomplete.
        </p>
        <div className="mt-3">
          <TagChipInput value={tags} onChange={setTags} />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          Fixed traits (0–10)
        </h2>
        <div className="mt-4 grid gap-4">
          {traits.map((t) => (
            <div key={t.code} className="rounded-2xl border border-[var(--line)] bg-white p-4">
              <label className="block text-sm font-semibold">
                <span className="flex justify-between">
                  <span>
                    {t.code} · {t.name}
                  </span>
                  <span className="tabular-nums text-[var(--muted)]">{fixed[t.code]?.value ?? 0}</span>
                </span>
                <input
                  type="range"
                  min={t.minValue}
                  max={t.maxValue}
                  step={0.5}
                  value={fixed[t.code]?.value ?? 0}
                  onChange={(e) =>
                    setFixed((prev) => ({
                      ...prev,
                      [t.code]: {
                        ...prev[t.code],
                        value: Number(e.target.value),
                      },
                    }))
                  }
                  className="mt-2 w-full accent-[var(--violet)]"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-[var(--muted)]">
                Rationale
                <textarea
                  value={fixed[t.code]?.rationale ?? ""}
                  onChange={(e) =>
                    setFixed((prev) => ({
                      ...prev,
                      [t.code]: {
                        ...prev[t.code],
                        rationale: e.target.value,
                      },
                    }))
                  }
                  rows={2}
                  placeholder="Why this score?"
                  className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-normal text-[var(--ink)]"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Freeform traits
          </h2>
          <button
            type="button"
            onClick={() => setFreeform((prev) => [...prev, { nameDisplay: "", valueDisplay: "" }])}
            className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-sm font-semibold"
          >
            Add
          </button>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Matching uses normalized exact text for now. Fuzzy synonyms are planned later.
        </p>
        <ul className="mt-4 space-y-2">
          {freeform.map((t, i) => (
            <li key={`freeform-${i}`} className="flex flex-wrap gap-2">
              <input
                aria-label={`Freeform trait name ${i + 1}`}
                placeholder="Name"
                value={t.nameDisplay}
                onChange={(e) =>
                  setFreeform((prev) =>
                    prev.map((row, idx) =>
                      idx === i ? { ...row, nameDisplay: e.target.value } : row,
                    ),
                  )
                }
                className="min-w-[8rem] flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <input
                aria-label={`Freeform trait value ${i + 1}`}
                placeholder="Value"
                value={t.valueDisplay}
                onChange={(e) =>
                  setFreeform((prev) =>
                    prev.map((row, idx) =>
                      idx === i ? { ...row, valueDisplay: e.target.value } : row,
                    ),
                  )
                }
                className="min-w-[8rem] flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setFreeform((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded-full px-3 text-sm text-[var(--coral)]"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        {freeform.some((t) => t.nameDisplay.trim() && t.valueDisplay.trim()) ? (
          <p className="mt-3 text-sm text-[var(--muted)]" data-testid="freeform-summary">
            Current:{" "}
            {freeform
              .filter((t) => t.nameDisplay.trim() && t.valueDisplay.trim())
              .map((t) => `${t.nameDisplay}: ${t.valueDisplay}`)
              .join(" · ")}
          </p>
        ) : null}
      </section>

      {isEdit ? (
        <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Examples
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold">
              Upload image
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f, "image");
                }}
              />
            </label>
            <label className="cursor-pointer rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold">
              Upload video
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f, "video");
                }}
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={urlKind}
              onChange={(e) => setUrlKind(e.target.value as "image" | "video")}
              className="rounded-xl border border-[var(--line)] bg-white px-2 py-2 text-sm"
            >
              <option value="image">Image URL</option>
              <option value="video">Video URL</option>
            </select>
            <input
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://…"
              className="min-w-[12rem] flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <input
              value={urlCaption}
              onChange={(e) => setUrlCaption(e.target.value)}
              placeholder="Caption"
              className="w-36 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void addUrlExample()}
              className="rounded-full bg-[var(--ink)] px-3 py-2 text-sm font-semibold text-white"
            >
              Add URL
            </button>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {examples.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#f7faff] px-3 py-2"
              >
                <span className="truncate">
                  {ex.kind}: {ex.storagePath || ex.url}
                </span>
                <button
                  type="button"
                  onClick={() => void removeExample(ex.id)}
                  className="text-[var(--coral)]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-[var(--muted)]">
          Save the form first, then you can attach image/video examples.
        </p>
      )}

      {neighbors.length > 0 ? (
        <section className="rounded-3xl border border-[var(--line)] bg-white/70 p-5">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            Nearest neighbors
          </h2>
          <ul className="mt-3 space-y-1 text-sm">
            {neighbors.map((n) => (
              <li key={n.id} className="flex justify-between gap-3">
                <Link href={`/forms/${n.slug}`} className="font-semibold hover:text-[var(--violet)]">
                  {n.name}
                </Link>
                <span className="text-[var(--muted)]">{(n.similarity * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p className="text-sm text-[var(--coral)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create form"}
        </button>
        <Link
          href="/admin"
          className="rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold"
        >
          Cancel
        </Link>
        {isEdit ? (
          <button
            type="button"
            onClick={() => void deleteForm()}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--coral)]"
          >
            Delete
          </button>
        ) : null}
      </div>
    </form>
  );
}
