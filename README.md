# Media Forms Atlas

A personal web app for cataloguing cultural and historical **media forms** (Opera, Kamishibai, Ukiyo-e, etc.) and exploring how they relate to each other.

Each form is scored on a fixed set of traits. Forms with similar scores sit closer together on a 2D **atlas**. Optional **similarity edges** highlight the strongest pairwise links. You can encode a chosen trait as **color & size** or a **heat** background, open **side panels** to inspect (and compare) forms, and filter by **tags**. Freeform traits and media examples (images/videos via upload or URL) are also supported.

Only an admin can create or edit forms. Everyone else can browse and view. The app is local-first (SQLite) and ready to move to cloud hosting later without becoming a multi-user product.

For product decisions and roadmap, see [PLAN.md](./PLAN.md). Sample trait data lives in [`reference/Media traits weighted.xlsx`](./reference/Media%20traits%20weighted.xlsx).

---

## Features

- **Fixed traits** — eight continuous scores (0–10), equal weight:
  - VIS Visual Participation  
  - AUD Auditory Participation  
  - EMB Embodied Participation  
  - LIV Liveness  
  - SEM Semantic Code  
  - MAT Perceived Materiality  
  - RAU Representational Autonomy  
  - TMP Temporal Structuring  
- **Freeform traits** — custom name/value pairs; proximity bonus when two forms share the same pair (normalized exact match today; fuzzy synonyms planned later)
- **Tags** — filter-only labels (do **not** affect atlas proximity). Free-type on admin edit with autocomplete; filter panel on Atlas and Browse with Any (OR) / All (AND). Filter state in the URL (`?tags=japan,performance&mode=and`). Unused tags are pruned when forms are deleted or tags are edited.
- **Atlas proximity map** — 2D MDS layout from trait distance + toggleable similarity edges. Node **position** means overall similarity; Default-view colors are decorative only.
- **Atlas view modes** (shared trait picker for the last two):
  - **Default** — palette-colored nodes, fixed size  
  - **Color & size** — selected trait drives node color and radius  
  - **Heat** — selected trait as a smooth background field; nodes stay even-sized  
- **Select / compare panels** — click a node for a side panel (radar + trait bars + tags + link to detail). **⌘/Ctrl-click** a second node to open two panels side by side (max two; toast if you try a third). Plain click replaces the selection. Esc / empty map / × clears.
- **Label placement** — labels prefer below the node and move (above / sides / diagonals) when they would overlap other nodes or labels.
- **Examples** — image/video via file upload or external URL  
- **Admin** — password-gated create/edit; public browse/detail  

---

## Quick start

```bash
cp .env.example .env   # then edit ADMIN_PASSWORD / AUTH_SECRET if you want
npm install
npm run db:reset       # create SQLite DB + seed sample forms (+ demo tags)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin login uses whatever you set as `ADMIN_PASSWORD` in `.env`.

| Setting | Where | From `.env.example` |
|--------|--------|---------------------|
| Admin password | `ADMIN_PASSWORD` | `change-me` |
| Auth cookie secret | `AUTH_SECRET` | placeholder string (required; app throws if unset) |
| Database | `DATABASE_URL` | `file:./dev.db` (created under `prisma/`) |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Serve production build |
| `npm run db:push` | Apply schema to SQLite |
| `npm run db:seed` | Seed traits + sample forms (+ demo tags) |
| `npm run db:reset` | Reset DB and re-seed |

---

## How proximity works

1. **Fixed distance** — Euclidean distance between the eight trait vectors, normalized to roughly `[0, 1]`.
2. **Freeform bonus** — if forms share normalized `(name, value)` pairs, similarity increases slightly (`α ≈ 0.2`). A trait that exists on only one form does not move anything until another form shares it.
3. **Layout** — classical MDS embeds pairwise distances into 2D (deterministic; stable across refreshes).
4. **Edges** — pairs above a similarity threshold are drawn when “Show edges” is on.
5. **Tags / view modes** — filtering and Color&size/Heat encodings do **not** recompute layout; positions stay fixed.

Core logic: [`src/lib/similarity.ts`](./src/lib/similarity.ts). Encoding helpers: [`src/lib/atlas-viz.ts`](./src/lib/atlas-viz.ts).

---

## Atlas interactions (cheat sheet)

| Action | Result |
|--------|--------|
| Click node | Open one select panel |
| ⌘/Ctrl-click second node | Open compare panels (max 2) |
| ⌘/Ctrl-click third node | In-app toast: max two nodes |
| Plain click while comparing | Clear both; select only that node |
| Esc / click empty map / × | Clear selection |
| View: Default / Color & size / Heat | Switch encoding; trait picker for the last two |
| Tag filter Any / All | OR vs AND; URL sync |

---

## Project structure

```
media-forms/
├── PLAN.md                 # Product plan and decisions
├── README.md               # This file
├── DATABASE.md             # Live DB structure (sync with schema.prisma)
├── reference/              # Source Excel / reference mockups
├── prisma/
│   ├── schema.prisma       # Data model (code source of truth)
│   ├── seed.ts             # Seeds 8 traits + 9 sample forms + demo tags
│   └── dev.db              # Local SQLite (gitignored)
├── public/
│   └── uploads/            # Admin-uploaded media (gitignored except .gitkeep)
└── src/
    ├── app/                # Next.js App Router (pages + API)
    ├── components/         # React UI
    └── lib/                # Auth, DB, similarity, atlas viz, helpers
```

### `src/app` — routes

| Path | Role |
|------|------|
| `/` | Atlas map (main view) |
| `/forms` | Browse list |
| `/forms/[slug]` | Form detail (traits, tags, examples, neighbors) |
| `/admin/login` | Admin password login |
| `/admin` | Admin dashboard |
| `/admin/forms/new` | Create form |
| `/admin/forms/[id]` | Edit form + examples |
| `/api/atlas` | Layout nodes/edges; optional `?neighborsOf=` |
| `/api/auth/login` | `POST` login / `DELETE` logout |
| `/api/forms` | List / create forms |
| `/api/forms/[id]` | Get / update / delete form |
| `/api/forms/[id]/examples` | Add/remove examples (JSON URL or multipart upload) |
| `/api/tags` | List tags with usage counts; optional `?q=` autocomplete |

### `src/components` — UI

| File | Role |
|------|------|
| `SiteHeader.tsx` | Nav (Atlas, Browse, Admin) |
| `AtlasCanvas.tsx` | Map SVG, edges, heat layer, selection, labels |
| `AtlasWithFilters.tsx` | Tag filter + view modes + compare panels |
| `AtlasViewControls.tsx` | Default / Color & size / Heat + trait picker |
| `AtlasSelectPanel.tsx` | Side panel: radar, bars, tags, detail link |
| `AtlasToast.tsx` | In-app toast (e.g. max two selections) |
| `TraitRadar.tsx` | Radar chart for fixed traits |
| `BrowseWithFilters.tsx` | Browse grid + tag filter |
| `TagFilterPanel.tsx` | Filter chips, Any/All mode, admin tag chip input |
| `TraitBars.tsx` | Fixed-trait bars |
| `ExampleGallery.tsx` | Image / video / YouTube embeds |
| `FormEditor.tsx` | Admin create/edit form |
| `LoginForm.tsx` / `LogoutButton.tsx` | Admin session UI |

### `src/lib` — domain logic

| File | Role |
|------|------|
| `prisma.ts` | Shared Prisma client (HMR-safe) |
| `auth.ts` | JWT cookie session + password check |
| `forms.ts` | Form queries for pages/API |
| `normalize.ts` | Freeform text normalize + slug helper |
| `similarity.ts` | Distance, neighbors, MDS layout |
| `tags.ts` | Tag normalize, assign, filter match, prune unused |
| `atlas-viz.ts` | Trait color/size scale + heat field |
| `label-layout.ts` | Collision-aware label placement |

### Data model (Prisma)

Full tables and ER diagram: **[DATABASE.md](./DATABASE.md)** (must stay in sync with `prisma/schema.prisma`).

- **MediaForm** — name, slug, description  
- **TraitDefinition** — fixed trait catalog (code, name, 0–10)  
- **FixedTraitValue** — form × trait score  
- **FreeformTrait** — display + normalized name/value  
- **Tag** / **MediaFormTag** — filter labels (many-to-many)  
- **MediaExample** — `image` \| `video`, either `url` or `storagePath`  

---

## Stack

- **Next.js** (App Router) + TypeScript + React  
- **Prisma** + **SQLite** (swap `DATABASE_URL` to Postgres for cloud)  
- **Tailwind CSS** — light, colorful UI  
- **jose** — signed admin session cookie  

---

## Auth model

There is no multi-user system. A single `ADMIN_PASSWORD` unlocks admin routes and write APIs. Public pages and `GET` list/detail stay open. Change password and `AUTH_SECRET` before any real deployment.

---

## Cloud later (not implemented yet)

When you host it:

1. Point `DATABASE_URL` at Postgres.  
2. Move uploads from `public/uploads` to object storage (S3/R2).  
3. Set strong `ADMIN_PASSWORD` and `AUTH_SECRET`.  
4. Deploy the same Next.js app (e.g. Vercel / Fly / Railway).  

Still one admin — no account registry.

---

## Out of scope (v1)

- Hierarchy / taxonomy tree  
- Fuzzy synonym matching for freeform traits  
- Per-trait weights  
- Axis-projection atlas mode (trait X × trait Y as map axes)  
- Multi-user accounts  

---

## License

Private personal project unless you add a license later.
