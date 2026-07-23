/** Normalize freeform trait name/value for exact matching (v1).
 * Future: fuzzy / synonym matching can replace or wrap this.
 */
export function normalizeTraitText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function makeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
