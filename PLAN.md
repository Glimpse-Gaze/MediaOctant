# Media Forms Atlas — Build Plan

## Goal

A personal, web-based catalog of cultural/historical **media forms** (e.g. Opera, Kamishibai, Ukiyo-e). While adding forms, the admin scores fixed traits and optional freeform traits. A visualization places similar forms closer together and can show similarity edges. When hosted, the site is public to view; only the admin can create/edit.

## Product decisions (locked)

| Topic | Decision |
|--------|----------|
| Domain | Media forms, not streaming categories |
| Hierarchy | None for v1; trait proximity only |
| Fixed traits | 8 dimensions, continuous ~0–10, **equal weight** |
| Freeform traits | Supported; contribute to proximity when shared |
| Freeform matching | **Normalized exact** (case/spacing); future: fuzzy synonyms |
| Singleton freeform | No map effect until ≥2 forms share name+value |
| Examples | File upload **and** external URLs (image/video) |
| Visualization | 2D trait map + **toggleable** similarity edges |
| Aesthetic | Modern, light, refreshing; gaming/colorful hints — **not** VOSviewer look |
| Users | Single admin editor; public read when hosted |
| Deploy | Local-first, cloud-ready later; not multi-user |

### Fixed trait vocabulary (from `reference/Media traits weighted.xlsx`)

1. VIS — Visual Participation  
2. AUD — Auditory Participation  
3. EMB — Embodied Participation  
4. LIV — Liveness  
5. SEM — Semantic Code  
6. MAT — Perceived Materiality  
7. RAU — Representational Autonomy  
8. TMP — Temporal Structuring  

---

## Tech stack

Chosen for a personal admin tool that deploys cleanly to the cloud later:

- **Next.js (App Router) + TypeScript + React** — UI and API in one app  
- **Prisma + SQLite** locally → switch datasource to **Postgres** on cloud (e.g. Neon/Supabase) with minimal schema change  
- **Tailwind CSS** — light, colorful UI  
- **d3-force / force-directed layout** (or `@react-force-graph-2d`) — map positions + edges  
- **NextAuth (Credentials)** or a single env-based admin session — password only, no multi-user accounts  
- **Local filesystem** for uploads in `public/uploads` (dev); **S3-compatible object storage** when cloud-hosted  

No hierarchy tables in v1.

---

## Data model

**Live schema docs:** [DATABASE.md](./DATABASE.md) (keep in sync with [`prisma/schema.prisma`](./prisma/schema.prisma)).

Product shape (unchanged intent):

- **Catalog:** `TraitDefinition` (fixed vocabulary) + `MediaForm`.
- **Scores:** `FixedTraitValue` (form × trait → number).
- **Custom:** `FreeformTrait` (form → name/value pairs; normalized for matching).
- **Tags:** `Tag` / `MediaFormTag` — filter only; do not affect proximity.
- **Examples:** `MediaExample` (`image` \| `video`; `url` and/or `storagePath`).
- Similarity / layout is **computed at read time**, not stored as a graph table in v1.

---

## Similarity and layout

### Distance (equal-weight fixed traits)

For forms \(A, B\) with fixed vectors \(\mathbf{a}, \mathbf{b} \in [0,10]^8\):

\[
d_{\text{fixed}} = \frac{\|\mathbf{a}-\mathbf{b}\|_2}{\sqrt{8}\cdot 10}
\]

Normalized to roughly \([0,1]\).

### Freeform bonus (Option A)

- Build multiset of normalized `(name, value)` pairs per form.  
- Shared pair count → similarity bonus, e.g.  
  \(s_{\text{free}} = \frac{|P_A \cap P_B|}{\max(|P_A|, |P_B|, 1)}\)  
- Forms with a unique freeform trait: intersection empty with everyone → **no effect** (as discussed).  
- Combined distance:  
  \(d = (1 - \alpha)\, d_{\text{fixed}} + \alpha\, (1 - s_{\text{free}})\)  
  with small \(\alpha\) (e.g. 0.15–0.25) so the 8D space remains primary.

### Layout

1. Compute pairwise distances for all forms.  
2. Place nodes with **force simulation**: repulsion + spring attraction proportional to similarity (or MDS/PCA init then light force refine).  
3. Draw edges for pairs above a similarity threshold; UI toggle **Show edges**.  
4. Recompute layout when forms/traits change (admin save).

### Future (noted, not v1)

- Fuzzy / synonym matching for freeform traits (e.g. `Japan` ≈ `Japanese`).  
- Per-trait weights.  
- Hierarchy.

---

## App structure (UX)

### Public / viewer

- **Home / Atlas:** full-viewport 2D map; nodes labeled; hover preview; click → detail. Edge toggle + optional “highlight neighbors.”  
- **Form detail:** name, description, radar or bar chart of 8 traits, freeform chips, media examples (gallery / embeds).  
- **Browse list:** searchable list as alternate entry (light, not dashboard-heavy).

### Admin (auth-gated)

- Login (single password).  
- **Create / edit form:** name, description, 8 sliders (0–10), freeform trait editor (add/remove pairs), examples (upload + URL).  
- Live or on-save preview of nearest neighbors (helps “categorize while adding”).  
- Seed/import from Excel (one-time or repeatable admin action).

### Visual direction

- Light background, airy spacing, saturated accent colors (game-adjacent without neon cyberpunk clutter).  
- Expressive non-default typography.  
- Soft motion: node settle, hover lift, edge fade-in on toggle.  
- Map is the hero composition; avoid dense academic chrome.

---

## Auth and hosting path

**Now:** local Next.js; admin password via env (`ADMIN_PASSWORD`); SQLite + local uploads.  

**Cloud later:** same app on Vercel/Fly/Railway; Postgres; S3/R2 for uploads; env secrets for admin password and storage. Still one admin — no user registry.

---

## Implementation phases

### Phase 1 — Foundation

- Scaffold Next.js + Prisma + Tailwind  
- Schema, seed 8 traits + Excel sample forms  
- Admin auth stub  
- CRUD API for forms, fixed values, freeform traits  

### Phase 2 — Atlas visualization

- Similarity service  
- Interactive map + edge toggle  
- Form detail page with trait display  

### Phase 3 — Examples and polish

- Image/video upload + URL examples  
- Neighbor hints on admin edit form  
- Visual polish (motion, color, typography)  
- README: run locally + notes for cloud deploy  

### Phase 4 — Cloud readiness (when you ask)

- Postgres + object storage config  
- Deploy checklist; no multi-user work  

---

## Out of scope (v1)

- Hierarchy / taxonomy tree  
- Multi-user accounts / roles beyond one admin  
- Fuzzy synonym freeform matching (documented for later)  
- Trait weight editor  
- Mobile-native apps  

---

## Success criteria

1. Admin can add a media form with 8 scores, freeform traits, and examples (file or URL).  
2. Atlas places forms with similar fixed (and shared freeform) profiles near each other.  
3. Similarity edges can be shown or hidden.  
4. Unique freeform traits appear on the form but do not move the map until shared.  
5. Sample spreadsheet data loads as the initial dataset.  
6. UI feels modern, light, and playfully colorful — not like bibliometric software.
