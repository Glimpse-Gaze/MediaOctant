# Media Forms Atlas

A personal web app for cataloguing cultural and historical **media forms** (Opera, Kamishibai, Ukiyo-e, etc.) and exploring how they relate to each other.

Each form is scored on a fixed set of traits. Forms with similar scores sit closer together on a 2D **atlas**. Optional **similarity edges** highlight the strongest pairwise links. You can also attach freeform traits and media examples (images/videos via upload or URL).

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
- **Tags** — simple labels for filtering only (do not affect atlas proximity). Free-type on admin edit with autocomplete; filter panel on Atlas and Browse with Any (OR) / All (AND) modes. Filter state in the URL (`?tags=japan,performance&mode=and`)
- **Atlas** — 2D layout from trait distance + toggleable similarity edges
- **Examples** — image/video via file upload or external URL
- **Admin** — password-gated create/edit; public browse/detail

---

## Quick start

```bash
cp .env.example .env
npm install
npm run db:reset       # create SQLite DB + seed sample forms
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Setting | Where | Local default |
|--------|--------|----------------|
| Admin password | `ADMIN_PASSWORD` in `.env` | `admin` |
| Auth cookie secret | `AUTH_SECRET` in `.env` | set in `.env` |
| Database | `DATABASE_URL` | `file:./dev.db` (under `prisma/`) |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Serve production build |
| `npm run db:push` | Apply schema to SQLite |
| `npm run db:seed` | Seed traits + sample forms |
| `npm run db:reset` | Reset DB and re-seed |

---

## How proximity works

1. **Fixed distance** — Euclidean distance between the eight trait vectors, normalized to roughly `[0, 1]`.
2. **Freeform bonus** — if forms share normalized `(name, value)` pairs, similarity increases slightly (`α ≈ 0.2`). A trait that exists on only one form does not move anything until another form shares it.
3. **Layout** — classical MDS embeds pairwise distances into 2D for the atlas.
4. **Edges** — pairs above a similarity threshold are drawn when “Show edges” is on.

Core logic: [`src/lib/similarity.ts`](./src/lib/similarity.ts).

---

## Project structure

```
media-forms/
├── PLAN.md                 # Product plan and decisions
├── README.md               # This file
├── reference/              # Source Excel / reference data (not runtime)
├── prisma/
│   ├── schema.prisma       # Data model
│   ├── seed.ts             # Seeds 8 traits + 9 sample forms
│   └── dev.db              # Local SQLite (gitignored)
├── public/
│   └── uploads/            # Admin-uploaded media (gitignored except .gitkeep)
└── src/
    ├── app/                # Next.js App Router (pages + API)
    ├── components/         # React UI
    └── lib/                # Auth, DB, similarity, helpers
```

### `src/app` — routes

| Path | Role |
|------|------|
| `/` | Atlas map (main view) |
| `/forms` | Browse list |
| `/forms/[slug]` | Form detail (traits, examples, neighbors) |
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
| `AtlasCanvas.tsx` | Interactive SVG map + edge toggle |
| `AtlasWithFilters.tsx` | Atlas + tag filter panel (URL sync) |
| `BrowseWithFilters.tsx` | Browse grid + tag filter panel |
| `TagFilterPanel.tsx` | Filter chips, Any/All mode, admin tag chip input |
| `TraitBars.tsx` | Fixed-trait bars on detail pages |
| `ExampleGallery.tsx` | Image / video / YouTube embeds |
| `FormEditor.tsx` | Admin create/edit form |
| `LoginForm.tsx` / `LogoutButton.tsx` | Admin session UI |

### `src/lib` — domain logic

| File | Role |
|------|------|
| `prisma.ts` | Shared Prisma client |
| `auth.ts` | JWT cookie session + password check |
| `forms.ts` | Form queries for pages/API |
| `normalize.ts` | Freeform text normalize + slug helper |
| `similarity.ts` | Distance, neighbors, MDS layout |
| `tags.ts` | Tag normalize, assign, filter match, URL helpers |

### Data model (Prisma)

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
- Multi-user accounts  

---

## License

Private personal project unless you add a license later.
