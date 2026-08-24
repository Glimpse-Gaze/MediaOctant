import { z } from "zod";

/** Accept plain numbers (legacy) or { value, note } objects. */
export const fixedTraitEntrySchema = z.union([
  z.number().min(0).max(10),
  z.object({
    value: z.number().min(0).max(10),
    note: z.string().optional().default(""),
  }),
]);

export type FixedTraitEntryInput = z.infer<typeof fixedTraitEntrySchema>;

export function normalizeFixedTraitEntry(entry: FixedTraitEntryInput | undefined): {
  value: number;
  note: string;
} {
  if (entry === undefined) return { value: 0, note: "" };
  if (typeof entry === "number") return { value: entry, note: "" };
  return { value: entry.value, note: entry.note?.trim() ?? "" };
}
