"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TagFilterMode, TagSummary } from "@/lib/tags";
import { parseModeParam, parseTagsParam } from "@/lib/tags";

export function useTagFilter(availableTags: TagSummary[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = useMemo(
    () => parseTagsParam(searchParams.get("tags")),
    [searchParams],
  );
  const mode = useMemo(
    () => parseModeParam(searchParams.get("mode")),
    [searchParams],
  );

  const syncUrl = useCallback(
    (nextTags: string[], nextMode: TagFilterMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextTags.length) {
        params.set("tags", nextTags.join(","));
      } else {
        params.delete("tags");
      }
      // Persist match mode even with no tags so the Any/All control can be set first
      if (nextMode === "and") {
        params.set("mode", "and");
      } else {
        params.delete("mode");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function toggleTag(slug: string) {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    syncUrl(next, mode);
  }

  function setMode(next: TagFilterMode) {
    syncUrl(selected, next);
  }

  function clear() {
    syncUrl([], mode);
  }

  // Drop selected tags that no longer exist (once tags have loaded)
  useEffect(() => {
    if (!availableTags.length || selected.length === 0) return;
    const known = new Set(availableTags.map((t) => t.slug));
    const filtered = selected.filter((s) => known.has(s));
    if (filtered.length !== selected.length) {
      syncUrl(filtered, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reconcile when tag catalog arrives
  }, [availableTags]);

  return { selected, mode, toggleTag, setMode, clear };
}

export function TagFilterPanel({
  tags,
  selected,
  mode,
  onToggle,
  onModeChange,
  onClear,
  matchedCount,
  totalCount,
}: {
  tags: TagSummary[];
  selected: string[];
  mode: TagFilterMode;
  onToggle: (slug: string) => void;
  onModeChange: (mode: TagFilterMode) => void;
  onClear: () => void;
  matchedCount: number;
  totalCount: number;
}) {
  if (!tags.length) {
    return (
      <div className="rounded-3xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--muted)]">
        No tags yet. Add tags when editing a media form.
      </div>
    );
  }

  return (
    <section
      className="rounded-3xl border border-[var(--line)] bg-white/70 p-4 shadow-sm"
      aria-label="Filter by tag"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.14em] text-[var(--violet)]">
            Filter by tag
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Showing {matchedCount} of {totalCount} form{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-full border border-[var(--line)] bg-white p-0.5 text-sm font-semibold"
            role="group"
            aria-label="Match mode"
          >
            <button
              type="button"
              onClick={() => onModeChange("or")}
              className={`rounded-full px-3 py-1.5 transition ${
                mode === "or"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Any
            </button>
            <button
              type="button"
              onClick={() => onModeChange("and")}
              className={`rounded-full px-3 py-1.5 transition ${
                mode === "and"
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              All
            </button>
          </div>
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = selected.includes(tag.slug);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.slug)}
              aria-pressed={active}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-gradient-to-r from-[var(--cyan)] to-[var(--violet)] text-white shadow-sm"
                  : "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--violet)]"
              }`}
            >
              {tag.name}
              <span className={`ml-1.5 tabular-nums ${active ? "opacity-80" : "text-[var(--muted)]"}`}>
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Controlled draft input for admin tag chips with autocomplete. */
export function TagChipInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<TagSummary[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = draft.trim();
    const handle = setTimeout(() => {
      fetch(`/api/tags${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.tags ?? []))
        .catch(() => setSuggestions([]));
    }, 150);
    return () => clearTimeout(handle);
  }, [draft]);

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = value.some((t) => t.toLowerCase() === trimmed.toLowerCase());
    if (!exists) onChange([...value, trimmed]);
    setDraft("");
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft.replace(/,/g, ""));
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const filtered = suggestions.filter(
    (s) => !value.some((v) => v.toLowerCase() === s.name.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#e8fff6] to-[#e8eeff] px-2.5 py-1 text-sm font-semibold"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-[var(--muted)] hover:text-[var(--coral)]"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? "Add tag…" : "Type a tag and press Enter"}
          className="min-w-[10rem] flex-1 bg-transparent py-1 text-sm outline-none"
        />
      </div>
      {open && filtered.length > 0 ? (
        <ul className="mt-1 max-h-40 overflow-auto rounded-xl border border-[var(--line)] bg-white py-1 text-sm shadow-md">
          {filtered.slice(0, 8).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-[#f7faff]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addTag(s.name)}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="text-[var(--muted)]">{s.count}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-[var(--muted)]">
        Tags are for filtering only — they do not change Octant proximity.
      </p>
    </div>
  );
}
