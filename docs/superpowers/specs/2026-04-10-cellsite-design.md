# Cellsite — Design Spec

**Date:** 2026-04-10
**Status:** Approved for implementation planning

## Overview

Cellsite is a public-facing creative portfolio website whose home surface is a literal spreadsheet UI. Cells on the grid are configurable link tiles that route visitors to internal content pages: a blog, an art gallery, document viewers, presentations, and an audio player. The aesthetic blends a full Excel/Google Sheets chrome (ribbon, formula bar, column/row headers, sheet tabs) with a Japanese art visual language (muted natural pigments, wabi-sabi restraint, bilingual Japanese/English labels).

The spreadsheet metaphor is the distinctive identity of the site — not a gimmick layered on top, but the core navigation surface that visitors interact with.

## Goals

- Create a memorable, distinctive portfolio that visitors will remember
- Centralize creative output (writing, art, audio, documents, presentations) behind one cohesive home surface
- Make cell configuration feel native to the spreadsheet metaphor (edit-in-place, double-click to configure, drag to move)
- Support dark and light modes with a cohesive Japanese art aesthetic in both
- Ship a v1 that works end-to-end without speculative complexity

## Non-Goals (v1)

- Authentication / multi-user / collaboration
- Server-side rendering, SEO optimization, RSS feed
- Search across content, tag filtering
- Comments on blog posts
- Analytics
- Image optimization, responsive variants, lazy-loading strategies beyond browser defaults
- Multi-sheet support (sheet tabs are decorative in v1)
- Drag-to-resize cell handles (numeric span inputs only)
- Undo/redo in the editor
- Rich text/WYSIWYG editor (v1 uses raw markdown)
- User-facing manual theme toggle (v1 auto-detects `prefers-color-scheme`)

## Visual Design

### Aesthetic Direction

Japanese art influence — clean lines, muted earth tones drawn from natural pigments (indigo, vermillion, matcha, ochre), subtle ink-wash gradients, and bilingual labels in katakana/kanji. The rigid spreadsheet grid structure provides the formal contrast; the soft color palette and Japanese typography add warmth and character.

### Branding

- Site name in the ribbon: **セルサイト** (Cell Site in katakana) + "Cellsite" in the page title
- Each content cell shows an English title and an optional Japanese subtitle (e.g., Blog / 随筆 · Essays)

### Light Mode

- Base background: warm parchment/washi (`#f5f0e8`)
- Ribbon and headers: `#ebe5d9`
- Grid lines: `#d4cdc0`
- Text primary: `#3a3a3a`
- Text secondary: `#8a8578`
- Accent (vermillion): `#c4563a`
- Cell backgrounds: subtle per-cell gradient tints toward each cell's accent color (8% saturation max), still reading as the same warm base

### Dark Mode

- Base background: deep indigo (`#14141f`)
- Ribbon and headers: `#0e0e18`
- Grid lines: `#22223a`
- Empty cells (recessed): `#0a0a14`
- Text primary: `#c8c8d0`
- Text secondary: `#5a5a70`
- Accent (warm vermillion): `#d4756a`
- Cell backgrounds: subtle per-cell gradient tints matching the light mode's restraint — nearly imperceptible color whispers

### Content Type Accent Colors

Each content type uses a distinct muted accent color, visible only on the cell title text (not backgrounds), so the grid feels unified:

| Type          | Light mode | Dark mode |
|---------------|------------|-----------|
| Blog          | `#c4563a` (vermillion) | `#d4756a` |
| Gallery       | `#3a7a5a` (matcha)     | `#7ab894` |
| Audio         | `#8a6a3a` (ochre)      | `#c09a6a` |
| Document      | `#3a5a8a` (indigo)     | `#7a96c0` |
| Presentation  | `#8a3a5a` (plum)       | `#b87a96` |
| External Link | `#5a7a3a` (moss)       | `#96b87a` |

### Mode Switching

Auto-detect via `prefers-color-scheme`. No manual toggle in v1. Both modes are fully supported across the spreadsheet home and all content viewers.

## The Spreadsheet Home Surface

The home page (`/`) is a full spreadsheet replica with the following regions, top to bottom:

### Ribbon

Styled like an Excel/Google Sheets ribbon. Contains site branding and top-level navigation:

- **Branding (left):** セルサイト
- **Nav tabs:** Home, Content, About, Contact
- **Edit mode toggle (right):** button to enter/exit edit mode. In v1, always visible (no auth). Later this becomes auth-gated.

### Formula Bar

Thin horizontal bar below the ribbon:

- **Cell reference display (left):** e.g., `B2` — shows the coordinates of the currently hovered/selected cell
- **fx label**
- **Content area:** displays the hovered/selected cell's title + Japanese subtitle, like a spreadsheet formula. Purely informational in v1.

### Grid

The main grid surface:

- **Default dimensions:** 10 columns × 20 rows visible by default; the visible area can scroll to reveal more rows if needed.
- **Column headers:** A, B, C, D... rendered like spreadsheet column letters
- **Row numbers:** 1, 2, 3... on the left
- **Cells:** empty grid positions are purely visual — they do not have database rows. Only configured cells exist as records in the `cells` table, identified by their `(row, col)` position. Cells can span multiple columns/rows (merged cells).
- Configured cells show an icon, an English title, and an optional Japanese subtitle, centered.

### Sheet Tabs

At the bottom of the grid, a row of sheet tabs styled like Excel worksheet tabs. In v1, only one tab ("Creative") is functional. Additional tabs ("Writing", "Code") are visible but decorative — clicking them does nothing. Multi-sheet support is deferred.

### Responsive Behavior

On all screen sizes, the spreadsheet stays as a spreadsheet — the grid does not collapse to a list.

- **Desktop (≥1024px):** Full grid visible, standard interaction.
- **Tablet (768–1023px):** Grid remains, cell sizes adjust.
- **Mobile (<768px):** Grid becomes horizontally and vertically scrollable. Users can pan the grid. Pinch-zoom is allowed (no `maximum-scale` lock in the viewport meta). Column and row headers scroll with the content. The ribbon and formula bar collapse to a compact form but remain visible at the top.

## Cell Interaction Model

### Viewing (Read Mode)

1. **Hover a cell** → formula bar updates to show that cell's coordinates and title.
2. **Click a cell** → the cell expands in place (gallery card animation), pushing neighboring cells aside. The expanded cell reveals a content preview (e.g., blog post title + excerpt, gallery cover image, audio player thumbnail, etc.) and an "Open" button.
3. **Click "Open" on the expanded cell** → navigates to the full content page for that cell's target (e.g., `/blog/my-post-slug`).
4. **Click outside the expanded cell, or press Escape** → collapses the cell back into its grid position.

### Editing (Edit Mode)

Edit mode is toggled via the ribbon button. In edit mode:

1. All cells gain a dashed outline indicating they are editable.
2. **Double-click an empty grid position** → opens the cell config popover to create a new cell at that position.
3. **Double-click a configured cell** → opens the cell config popover to edit it. Config fields:
   - **Type** (dropdown): Blog, Gallery, Document, Presentation, Audio, External Link
   - **Title** (text)
   - **Japanese subtitle** (text, optional)
   - **Content target** (depends on type): picker to select an existing content item (e.g., for a Blog cell, pick which blog post this cell surfaces). For External Link type, this is a URL field.
   - **Icon** (picker): choose from a preset set of emoji icons (curated list shipped with the app; no custom upload in v1).
   - **Column span** (number): default 1
   - **Row span** (number): default 1
   - **Save** / **Cancel** / **Delete cell**
4. **Drag a cell** → in edit mode, dragging a cell moves it to a new grid position. The drop is allowed only if every grid position the cell would occupy (based on its row_span × col_span) is either currently empty or currently occupied by the cell being dragged itself. If any target position is occupied by a different cell, the drop is rejected and the cell snaps back to its original position.
5. **Right-click a configured cell** → context menu with Edit, Delete, Duplicate.
6. **Exiting edit mode** → ribbon toggle again; unsaved popover changes prompt for confirmation.

Content creation (writing a blog post, uploading a gallery image, creating a slide deck) is NOT done from the cell config popover. The popover only links existing content. Content is created in dedicated per-type editor pages navigated to from the ribbon's "Content" menu.

## Content Types

All content types are hosted internally. Each has its own viewer page and its own editor page. All viewers share a common header with a "back to spreadsheet" link and theme support.

### Blog

- **Data:** id, slug, title, body (markdown), cover_image, published_at, tags (text array)
- **Viewer (`/blog` and `/blog/:slug`):** list view shows recent posts with cover image, title, excerpt; detail view renders markdown to HTML with a readable typography scale.
- **Editor (`/edit/blog` and `/edit/blog/:slug`):** raw markdown textarea, title input, slug input, cover image upload, tag input, publish date picker.

### Gallery

- **Data:** id, title, description, image_path, medium, year, dimensions, ordering
- **Viewer (`/gallery` and `/gallery/:id`):** grid view of image thumbnails; click opens a lightbox with navigation (prev/next, arrow keys), metadata (medium, year, dimensions) as a caption.
- **Editor (`/edit/gallery`):** upload form (multi-file), per-item metadata inputs, reorder via drag handles.

### Documents

- **Data:** id, slug, title, body (markdown)
- **Viewer (`/docs/:slug`):** single-page layout optimized for reading, print-friendly CSS, different typography from blog (more "document" feel — wider columns, headers).
- **Editor (`/edit/docs` and `/edit/docs/:slug`):** raw markdown textarea, title input, slug input.

### Presentations

- **Data:** id, slug, title, slides (JSONB array of markdown strings)
- **Viewer (`/presentations/:slug`):** full-screen slide viewer. One slide at a time, navigated with arrow keys, on-screen prev/next buttons, swipe on mobile. Each slide renders its markdown. Slide counter in the corner. Escape exits to list view.
- **Editor (`/edit/presentations` and `/edit/presentations/:slug`):** title input, slug input, a list of slide markdown blocks with add/remove/reorder.
- **v1 limit:** no transitions, no themes per deck, no speaker notes. Just markdown slides.

### Audio

- **Data:** id, title, description, audio_path, artwork_path, duration (seconds), ordering
- **Viewer (`/audio` and `/audio/:id`):** playlist view with artwork tiles; detail view shows large artwork, title, description, and an HTML5 audio player. Basic controls (play/pause, seek, volume).
- **Editor (`/edit/audio`):** upload form (audio file + artwork), metadata inputs, reorder.

### External Link

- **Data:** stored inline on the cell itself (just a URL string) — does not get its own table
- **Behavior:** clicking the cell's "Open" button opens the URL in a new tab. The cell's "preview" on expand shows the URL and destination name.

## Technical Architecture

### Stack

- **Frontend:** Vite + React + TypeScript
- **Styling:** Tailwind CSS with CSS custom properties for theme tokens (enables dark/light mode via `data-theme` or `prefers-color-scheme`)
- **Routing:** React Router
- **State:** React Query for server state, lightweight Zustand or React context for edit-mode UI state
- **Backend:** Fastify + TypeScript
- **Database access:** `postgres` driver + `drizzle-orm` for typed queries and migrations
- **Database host:** ghost.build (managed Postgres)
- **File storage:** Persistent volume on Railway/dailey.cloud mounted at `/app/uploads`. Files served via Fastify static routes at `/uploads/...`.
- **Build:** Vite builds frontend to `frontend/dist/`; Fastify serves those files as static assets alongside API routes at `/api/*`.

### Monorepo Layout

```
cellsite/
├── package.json              # npm workspaces: frontend, backend, shared
├── frontend/
│   ├── src/
│   │   ├── spreadsheet/      # Grid, Cell, Ribbon, FormulaBar, SheetTabs
│   │   ├── viewers/          # BlogViewer, GalleryViewer, DocViewer, PresentationViewer, AudioViewer
│   │   ├── editors/          # BlogEditor, GalleryEditor, DocEditor, PresentationEditor, AudioEditor, CellConfigPopover
│   │   ├── theme/            # Tokens, ThemeProvider
│   │   ├── lib/              # API client, hooks
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── cells.ts
│   │   │   ├── blog.ts
│   │   │   ├── gallery.ts
│   │   │   ├── documents.ts
│   │   │   ├── presentations.ts
│   │   │   └── audio.ts
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle schema
│   │   │   ├── migrations/
│   │   │   └── client.ts
│   │   ├── uploads/          # File upload handler
│   │   └── server.ts
│   └── package.json
├── shared/
│   └── types.ts              # CellConfig, BlogPost, GalleryItem, etc.
└── README.md
```

### API Surface

All API routes under `/api`:

- `GET /api/cells` → list all cells
- `POST /api/cells` → create a new cell
- `PATCH /api/cells/:id` → update a cell (config popover save)
- `DELETE /api/cells/:id` → delete a cell
- `POST /api/cells/reorder` → bulk position update (after drag)
- `GET /api/blog`, `GET /api/blog/:slug`, `POST /api/blog`, `PATCH /api/blog/:slug`, `DELETE /api/blog/:slug`
- `GET /api/gallery`, `GET /api/gallery/:id`, `POST /api/gallery`, `PATCH /api/gallery/:id`, `DELETE /api/gallery/:id`
- `GET /api/documents`, `GET /api/documents/:slug`, `POST /api/documents`, `PATCH /api/documents/:slug`, `DELETE /api/documents/:slug`
- `GET /api/presentations`, `GET /api/presentations/:slug`, `POST /api/presentations`, `PATCH /api/presentations/:slug`, `DELETE /api/presentations/:slug`
- `GET /api/audio`, `GET /api/audio/:id`, `POST /api/audio`, `PATCH /api/audio/:id`, `DELETE /api/audio/:id`
- `POST /api/uploads` → multipart upload for images, audio, artwork. Returns a path usable by other entity creates.

### Database Schema

```
cells
├── id                uuid primary key
├── row               integer
├── col               integer
├── row_span          integer default 1
├── col_span          integer default 1
├── sheet             text default 'creative'
├── type              text ('blog'|'gallery'|'document'|'presentation'|'audio'|'external')
├── title             text
├── subtitle_ja       text nullable
├── icon              text
├── target_id         uuid nullable  (references content item)
├── target_table      text nullable  (which table target_id refers to)
├── external_url      text nullable  (only for type='external')
├── created_at        timestamp
└── updated_at        timestamp
unique index on (sheet, row, col) — enforces one cell per grid position

blog_posts
├── id, slug (unique), title, body (text, markdown), cover_image (text path), published_at, tags (text[]), created_at, updated_at

gallery_items
├── id, title, description, image_path, medium, year (int), dimensions, ordering (int), created_at, updated_at

documents
├── id, slug (unique), title, body (text, markdown), created_at, updated_at

presentations
├── id, slug (unique), title, slides (jsonb — array of markdown strings), created_at, updated_at

audio_tracks
├── id, title, description, audio_path, artwork_path, duration (int seconds), ordering (int), created_at, updated_at
```

### Data Flow (home page load)

1. Browser `GET /` → Fastify serves `frontend/dist/index.html`.
2. React app boots → `GET /api/cells?sheet=creative` → renders the grid.
3. User clicks cell → React triggers expand animation, fetches the cell's target content preview if needed.
4. User clicks "Open" → React Router navigates to `/blog/:slug` (or other viewer route).
5. That route fetches its content from the corresponding API endpoint → renders the viewer.
6. "Back to spreadsheet" → returns to `/`.

### Deployment

- Single service on Railway or dailey.cloud
- Deploys from GitHub repo on push
- **Build command:** `npm install && npm run build` (runs Vite build for frontend, TypeScript build for backend)
- **Start command:** `npm start` (runs `node backend/dist/server.js`)
- **Environment variables:**
  - `DATABASE_URL` — ghost.build Postgres connection string
  - `PORT` — assigned by platform
  - `NODE_ENV=production`
  - `UPLOAD_DIR=/app/uploads`
- **Persistent volume** mounted at `/app/uploads` for user-uploaded files
- No Docker in v1 — native Node.js deployment on the platform

## Component Boundaries (Frontend)

Units should be independently understandable and testable.

- **`spreadsheet/Grid`** — renders the grid given a list of cell configs and a column/row count. Accepts callbacks for click/hover/drag. Doesn't know about content types.
- **`spreadsheet/Cell`** — renders a single cell's visual state (read mode vs edit mode vs expanded). Props: cell config, mode, callbacks. Doesn't fetch data.
- **`spreadsheet/Ribbon`** — top nav bar. Props: active tab, edit mode state, callbacks.
- **`spreadsheet/FormulaBar`** — displays the currently-hovered cell's reference and title. Pure display component.
- **`spreadsheet/SheetTabs`** — bottom tab bar (decorative in v1).
- **`editors/CellConfigPopover`** — form for editing a cell's config. Props: cell, onSave, onCancel, onDelete. Self-contained; manages its own form state.
- **`viewers/*Viewer`** — one per content type. Each fetches its own data via a hook and renders it. Independent of the grid.
- **`editors/*Editor`** — one per content type. Paired with a viewer, accessed via `/edit/*` routes.
- **`theme/ThemeProvider`** — wraps the app, sets CSS custom properties based on `prefers-color-scheme`.
- **`lib/api`** — thin API client. Each content type has its own module (`api/cells.ts`, `api/blog.ts`, etc.) returning typed results.

## Component Boundaries (Backend)

- **`server.ts`** — boots Fastify, registers routes, serves static frontend, serves `/uploads/*`, connects to DB.
- **`routes/cells.ts`** — CRUD + reorder handler for cells. Only file that knows about cell config shape.
- **`routes/blog.ts`, `routes/gallery.ts`, etc.** — one route file per content type. CRUD for that type.
- **`routes/uploads.ts`** — multipart upload handler. Writes to `UPLOAD_DIR`, returns the path.
- **`db/schema.ts`** — Drizzle schema for all tables. Single source of truth for DB shape.
- **`db/client.ts`** — exports a singleton Drizzle client.

## Testing Strategy

- **Backend unit tests:** for each route file, use `fastify.inject` to test API endpoints against a test database. Drizzle migrations run at test setup.
- **Frontend component tests:** React Testing Library for cell grid interactions (click, drag, edit mode). Mock the API client.
- **E2E smoke test:** one Playwright test that loads `/`, enters edit mode, configures a cell, saves, reloads, and confirms the cell persists.

v1 does not require exhaustive coverage — focus on the spreadsheet interaction layer and the cell persistence loop, since those are the riskiest parts.

## Success Criteria for v1

- Spreadsheet home renders with a grid of cells, ribbon, formula bar, sheet tab, column/row headers
- Dark and light modes work based on system preference
- Cells can be configured in edit mode: type, title, subtitle, content target, icon, span
- Cells can be dragged to new positions and persist
- All six content types have working viewers and editors
- Clicking a cell expands it; clicking "Open" navigates to the full content page
- Mobile users can pan the grid
- Site deploys from GitHub to Railway or dailey.cloud and works in production with ghost.build Postgres
- Uploaded images and audio persist across deploys (via volume)

## Open Questions Resolved During Brainstorming

- **CMS vs custom?** — Custom. Ghost.build provides Postgres; we build our own thin API layer and viewers. No Strapi/Directus.
- **Docker?** — No. Railway and dailey.cloud deploy Node.js natively. Revisit if we add multi-service dependencies.
- **Auth?** — Deferred from v1. Edit mode is open in v1; add gating before publishing editable surface.
- **SSR?** — No. Client-side rendered is fine for v1. Revisit if SEO becomes important.
- **Content created from cell config?** — No. Cell config only links to existing content. Creation happens in per-type editors.

## Environment Prerequisites (already in place)

- **Ghost CLI** (`ghost`) is installed locally. Use it directly for database lifecycle operations: `ghost create`, `ghost list`, `ghost psql`, etc.
- **Ghost MCP server** is configured. Prefer MCP tools over shell invocations when the implementing agent has access to them — for creating databases, executing SQL, inspecting schema, and fetching Ghost/Postgres documentation. This means the implementation plan can provision the `cellsite` database, run migrations, and inspect state without shelling out manually.
