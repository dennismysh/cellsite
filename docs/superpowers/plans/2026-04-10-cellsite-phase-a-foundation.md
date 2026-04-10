# Cellsite Phase A — Foundation & Spreadsheet Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed, working spreadsheet-style portfolio website where visitors see a grid of configurable cells, and the site owner can enter edit mode to create/edit/move/delete cells that link to external URLs. Validates the entire spreadsheet interaction model + deployment pipeline before investing in rich content types.

**Architecture:** Node.js monorepo with npm workspaces. Fastify monolith serves both API routes (`/api/*`) and the built Vite/React frontend. Postgres database hosted on ghost.build. Drizzle ORM for typed queries and migrations. Tailwind with CSS custom properties for dark/light theming. Deploy to Railway or dailey.cloud from GitHub (no Docker).

**Tech Stack:** TypeScript, Node.js 22, Fastify 4, Drizzle ORM, Postgres (via ghost.build), React 18, Vite 5, React Router 6, React Query 5, Tailwind CSS 3, Zustand, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-04-10-cellsite-design.md`

---

## File Structure Overview

```
cellsite/
├── package.json                     # Root: workspaces, scripts
├── tsconfig.json                    # Root TS config
├── .gitignore
├── .env.example
├── README.md
├── shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── types.ts                 # CellConfig, CellType, Sheet types
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── vitest.config.ts
│   └── src/
│       ├── server.ts                # Fastify bootstrap
│       ├── env.ts                   # Validated env vars
│       ├── db/
│       │   ├── client.ts            # Singleton Drizzle client
│       │   ├── schema.ts            # Drizzle schema (cells table only in Phase A)
│       │   └── migrations/
│       ├── routes/
│       │   ├── cells.ts             # CRUD + reorder
│       │   └── health.ts            # Liveness check
│       └── static.ts                # Serve frontend dist/
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── index.html
│   ├── vitest.config.ts
│   └── src/
│       ├── main.tsx                 # React entry
│       ├── App.tsx                  # Router shell
│       ├── index.css                # Tailwind base + theme tokens
│       ├── lib/
│       │   ├── api.ts               # Fetch wrapper
│       │   └── cells.ts             # Typed cell API client
│       ├── theme/
│       │   ├── ThemeProvider.tsx    # prefers-color-scheme detection
│       │   └── tokens.css           # CSS custom properties for both modes
│       ├── spreadsheet/
│       │   ├── SpreadsheetPage.tsx  # Home route
│       │   ├── Ribbon.tsx
│       │   ├── FormulaBar.tsx
│       │   ├── SheetTabs.tsx
│       │   ├── Grid.tsx
│       │   ├── Cell.tsx
│       │   ├── ExpandedCell.tsx     # Gallery-card expand state
│       │   ├── useEditMode.ts       # Zustand store
│       │   └── useHoveredCell.ts    # Hover state for formula bar
│       └── editors/
│           └── CellConfigPopover.tsx
├── e2e/
│   ├── package.json
│   ├── playwright.config.ts
│   └── spreadsheet.spec.ts
└── docs/
    └── superpowers/
        ├── specs/
        └── plans/
```

**Decomposition rationale:**
- **shared/types.ts** — single source of truth for types used in both FE and BE.
- **backend/routes/cells.ts** — all cell CRUD handlers in one file; small enough to read in one go, all related.
- **frontend/spreadsheet/** — all the spreadsheet UI pieces live together; they change together when the metaphor evolves.
- **frontend/editors/CellConfigPopover.tsx** — separate from the spreadsheet folder because it's modal UI overlay, not part of the grid layout.
- **frontend/theme/** — theme logic is cross-cutting; isolating it makes dark/light swap trivial to test.

---

## Task Ordering and Phases

Tasks are ordered so each leaves the project in a working, committable state. Rough phases:

- **Tasks 1–5:** Monorepo skeleton + shared types + basic tooling
- **Tasks 6–11:** Backend — Fastify, Drizzle, cells schema, CRUD API with tests
- **Tasks 12–17:** Frontend shell — Vite, Tailwind, theme tokens, routing, API client
- **Tasks 18–25:** Spreadsheet UI — Ribbon, FormulaBar, Grid, Cell, SheetTabs, read mode interactions
- **Tasks 26–31:** Edit mode — popover, drag, create/update/delete, expand-to-open
- **Task 32:** External Link content resolution (cell "Open" → `window.open(url, '_blank')`)
- **Task 33:** E2E smoke test
- **Tasks 34–36:** Deployment scripts + README + GitHub push instructions

---

## Task 1: Initialize the monorepo root

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "cellsite",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "workspaces": [
    "shared",
    "backend",
    "frontend",
    "e2e"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "build": "npm run build --workspace shared && npm run build --workspace frontend && npm run build --workspace backend",
    "start": "npm run start --workspace backend",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

- [ ] **Step 2: Create root `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
.superpowers/
backend/src/db/migrations/meta/
uploads/
playwright-report/
test-results/
```

- [ ] **Step 4: Create `.env.example`**

```
DATABASE_URL=postgres://user:pass@host:5432/cellsite
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

- [ ] **Step 5: Create minimal `README.md`**

```markdown
# Cellsite

A portfolio website whose home surface is a spreadsheet.

## Development

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` from ghost.build.
2. `npm install`
3. `npm run build`
4. `npm run dev`

## Deployment

See `docs/superpowers/specs/2026-04-10-cellsite-design.md` for architecture details.
```

- [ ] **Step 6: Initialize git repo and first commit**

```bash
git init
git add package.json tsconfig.json .gitignore .env.example README.md
git commit -m "chore: initialize cellsite monorepo"
```

Expected: git repo initialized, files committed.

---

## Task 2: Create the `shared` workspace with core types

**Files:**
- Create: `shared/package.json`
- Create: `shared/tsconfig.json`
- Create: `shared/src/types.ts`

- [ ] **Step 1: Create `shared/package.json`**

```json
{
  "name": "@cellsite/shared",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/types.js",
  "types": "./dist/types.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types.d.ts",
      "default": "./dist/types.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `shared/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create `shared/src/types.ts`**

```typescript
export type CellType =
  | "blog"
  | "gallery"
  | "document"
  | "presentation"
  | "audio"
  | "external";

export interface Cell {
  id: string;
  sheet: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
  type: CellType;
  title: string;
  subtitleJa: string | null;
  icon: string;
  targetId: string | null;
  targetTable: string | null;
  externalUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CellCreateInput {
  sheet?: string;
  row: number;
  col: number;
  rowSpan?: number;
  colSpan?: number;
  type: CellType;
  title: string;
  subtitleJa?: string | null;
  icon: string;
  targetId?: string | null;
  targetTable?: string | null;
  externalUrl?: string | null;
}

export type CellUpdateInput = Partial<Omit<CellCreateInput, "sheet">>;

export interface CellReorderInput {
  id: string;
  row: number;
  col: number;
}

export const CELL_TYPES: readonly CellType[] = [
  "blog",
  "gallery",
  "document",
  "presentation",
  "audio",
  "external",
] as const;

export const DEFAULT_SHEET = "creative";
export const DEFAULT_GRID_COLS = 10;
export const DEFAULT_GRID_ROWS = 20;
```

- [ ] **Step 4: Install and build shared**

```bash
npm install
npm run build --workspace shared
```

Expected: `shared/dist/types.js` and `shared/dist/types.d.ts` exist, no errors.

- [ ] **Step 5: Commit**

```bash
git add shared/
git commit -m "feat(shared): add cell types and shared constants"
```

---

## Task 3: Create the backend workspace skeleton

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/server.ts`
- Create: `backend/src/env.ts`

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "@cellsite/backend",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@cellsite/shared": "*",
    "@fastify/cors": "^9.0.1",
    "@fastify/static": "^7.0.4",
    "dotenv": "^16.4.5",
    "drizzle-orm": "^0.33.0",
    "fastify": "^4.28.1",
    "postgres": "^3.4.4",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.5.0",
    "drizzle-kit": "^0.24.2",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

- [ ] **Step 3: Create `backend/src/env.ts`**

```typescript
import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  UPLOAD_DIR: z.string().default("./uploads"),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 4: Create `backend/src/server.ts` (minimal bootstrap)**

```typescript
import Fastify from "fastify";
import { env } from "./env.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
```

- [ ] **Step 5: Install dependencies and typecheck**

```bash
npm install
npm run typecheck --workspace backend
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "feat(backend): add fastify server skeleton with health check"
```

---

## Task 4: Set up vitest and write the first failing health-check test

**Files:**
- Create: `backend/vitest.config.ts`
- Create: `backend/src/server.test.ts`

- [ ] **Step 1: Create `backend/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    testTimeout: 10000,
  },
});
```

- [ ] **Step 2: Create `backend/src/server.test.ts`**

```typescript
import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "./server.js";

describe("server", () => {
  let app: FastifyInstance | null = null;

  afterEach(async () => {
    if (app) {
      await app.close();
      app = null;
    }
  });

  it("returns ok on GET /api/health", async () => {
    app = await buildServer();
    const response = await app.inject({ method: "GET", url: "/api/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
```

- [ ] **Step 3: Create a `.env` file for tests (or set env inline)**

Create `backend/.env.test`:

```
DATABASE_URL=postgres://test:test@localhost:5432/cellsite_test
NODE_ENV=test
PORT=0
```

Update `backend/vitest.config.ts` to load it:

```typescript
import { defineConfig } from "vitest/config";
import { config } from "dotenv";

config({ path: ".env.test" });

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    testTimeout: 10000,
  },
});
```

- [ ] **Step 4: Run the test**

```bash
npm run test --workspace backend
```

Expected: PASS — health check returns `{ status: "ok" }`.

- [ ] **Step 5: Commit**

```bash
git add backend/vitest.config.ts backend/src/server.test.ts backend/.env.test
git commit -m "test(backend): add health check test with vitest"
```

---

## Task 5: Provision the ghost.build database

**Files:** none (infrastructure step)

- [ ] **Step 1: Create the database using ghost CLI or MCP**

If the ghost MCP is available to the executor, use `mcp__ghost__ghost_create_database` (or equivalent) with name `cellsite`. Otherwise, run:

```bash
ghost create cellsite
```

Expected output: confirmation that `cellsite` database is created, with a connection string.

- [ ] **Step 2: Copy the DATABASE_URL to `backend/.env`**

Create `backend/.env`:

```
DATABASE_URL=<connection string from ghost create>
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
```

- [ ] **Step 3: Verify connection**

```bash
ghost list
```

Expected: `cellsite` appears in the list with status "running".

- [ ] **Step 4: Test connection from backend**

```bash
cd backend
npx tsx -e "import postgres from 'postgres'; import { config } from 'dotenv'; config(); const sql = postgres(process.env.DATABASE_URL); const result = await sql\`SELECT 1 as ok\`; console.log(result); await sql.end();"
```

Expected: `[ { ok: 1 } ]`

- [ ] **Step 5: Commit** (no file changes, but commit an entry to CHANGELOG or skip this step)

No commit needed — infrastructure step.

---

## Task 6: Add Drizzle schema for the `cells` table

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/client.ts`
- Create: `backend/drizzle.config.ts`

- [ ] **Step 1: Create `backend/drizzle.config.ts`**

```typescript
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create `backend/src/db/schema.ts`**

```typescript
import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const cells = pgTable(
  "cells",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    sheet: text("sheet").notNull().default("creative"),
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    rowSpan: integer("row_span").notNull().default(1),
    colSpan: integer("col_span").notNull().default(1),
    type: text("type").notNull(),
    title: text("title").notNull(),
    subtitleJa: text("subtitle_ja"),
    icon: text("icon").notNull(),
    targetId: uuid("target_id"),
    targetTable: text("target_table"),
    externalUrl: text("external_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sheetPositionUnique: uniqueIndex("cells_sheet_row_col_unique").on(
      table.sheet,
      table.row,
      table.col,
    ),
  }),
);

export type DbCell = typeof cells.$inferSelect;
export type DbCellInsert = typeof cells.$inferInsert;
```

- [ ] **Step 3: Create `backend/src/db/client.ts`**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env.js";
import * as schema from "./schema.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
});

export const db = drizzle(queryClient, { schema });

export async function closeDb() {
  await queryClient.end();
}
```

- [ ] **Step 4: Generate the initial migration**

```bash
npm run db:generate --workspace backend
```

Expected: a new file under `backend/src/db/migrations/0000_*.sql` containing `CREATE TABLE "cells"` and the unique index.

- [ ] **Step 5: Create `backend/src/db/migrate.ts` runner**

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "../env.js";

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 6: Run migrations against ghost.build**

```bash
npm run db:migrate --workspace backend
```

Expected: `Migrations complete.` The `cells` table now exists on ghost.build.

- [ ] **Step 7: Verify via ghost**

```bash
ghost psql cellsite -c "\d cells"
```

Expected: shows the `cells` table columns and the unique index.

- [ ] **Step 8: Commit**

```bash
git add backend/drizzle.config.ts backend/src/db/
git commit -m "feat(backend): add drizzle schema and cells table migration"
```

---

## Task 7: Write failing tests for cells CRUD routes

**Files:**
- Create: `backend/src/routes/cells.test.ts`

- [ ] **Step 1: Create the test file with failing tests**

```typescript
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../server.js";
import { db, closeDb } from "../db/client.js";
import { cells } from "../db/schema.js";

describe("cells routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildServer();
    await db.delete(cells);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await closeDb();
  });

  it("GET /api/cells returns an empty array when no cells exist", async () => {
    const response = await app.inject({ method: "GET", url: "/api/cells" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it("POST /api/cells creates a new cell and returns it", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        row: 0,
        col: 0,
        type: "external",
        title: "GitHub",
        subtitleJa: "コード",
        icon: "🐙",
        externalUrl: "https://github.com/example",
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.title).toBe("GitHub");
    expect(body.externalUrl).toBe("https://github.com/example");
    expect(body.rowSpan).toBe(1);
    expect(body.colSpan).toBe(1);
    expect(body.sheet).toBe("creative");
  });

  it("POST /api/cells rejects duplicate (sheet, row, col)", async () => {
    await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        row: 0,
        col: 0,
        type: "external",
        title: "A",
        icon: "🐙",
        externalUrl: "https://a.example",
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/api/cells",
      payload: {
        row: 0,
        col: 0,
        type: "external",
        title: "B",
        icon: "🦊",
        externalUrl: "https://b.example",
      },
    });
    expect(response.statusCode).toBe(409);
  });

  it("GET /api/cells lists existing cells", async () => {
    await db.insert(cells).values({
      sheet: "creative",
      row: 1,
      col: 2,
      type: "external",
      title: "Existing",
      icon: "⭐",
      externalUrl: "https://example.com",
    });
    const response = await app.inject({ method: "GET", url: "/api/cells" });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("Existing");
  });

  it("PATCH /api/cells/:id updates fields", async () => {
    const [created] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "Old",
        icon: "⭐",
        externalUrl: "https://old.example",
      })
      .returning();

    const response = await app.inject({
      method: "PATCH",
      url: `/api/cells/${created.id}`,
      payload: { title: "New", externalUrl: "https://new.example" },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.title).toBe("New");
    expect(body.externalUrl).toBe("https://new.example");
  });

  it("DELETE /api/cells/:id removes the cell", async () => {
    const [created] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "Doomed",
        icon: "💀",
        externalUrl: "https://rip.example",
      })
      .returning();

    const response = await app.inject({
      method: "DELETE",
      url: `/api/cells/${created.id}`,
    });
    expect(response.statusCode).toBe(204);

    const list = await app.inject({ method: "GET", url: "/api/cells" });
    expect(list.json()).toEqual([]);
  });

  it("POST /api/cells/reorder updates positions atomically", async () => {
    const [a] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 0,
        col: 0,
        type: "external",
        title: "A",
        icon: "🅰️",
        externalUrl: "https://a.example",
      })
      .returning();
    const [b] = await db
      .insert(cells)
      .values({
        sheet: "creative",
        row: 1,
        col: 0,
        type: "external",
        title: "B",
        icon: "🅱️",
        externalUrl: "https://b.example",
      })
      .returning();

    const response = await app.inject({
      method: "POST",
      url: "/api/cells/reorder",
      payload: {
        updates: [
          { id: a.id, row: 5, col: 5 },
          { id: b.id, row: 6, col: 5 },
        ],
      },
    });
    expect(response.statusCode).toBe(200);
    const list = await app.inject({ method: "GET", url: "/api/cells" });
    const items = list.json();
    const reorderedA = items.find((c: { id: string }) => c.id === a.id);
    expect(reorderedA.row).toBe(5);
    expect(reorderedA.col).toBe(5);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run test --workspace backend
```

Expected: all `cells routes` tests FAIL (route not registered yet), health check still passes.

- [ ] **Step 3: Commit the failing tests**

```bash
git add backend/src/routes/cells.test.ts
git commit -m "test(backend): add failing cells CRUD route tests"
```

---

## Task 8: Implement the cells CRUD routes to make tests pass

**Files:**
- Create: `backend/src/routes/cells.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Create `backend/src/routes/cells.ts`**

```typescript
import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { cells } from "../db/schema.js";
import { CELL_TYPES, DEFAULT_SHEET } from "@cellsite/shared";

const cellTypeSchema = z.enum(CELL_TYPES as unknown as [string, ...string[]]);

const createSchema = z.object({
  sheet: z.string().default(DEFAULT_SHEET),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  rowSpan: z.number().int().min(1).default(1),
  colSpan: z.number().int().min(1).default(1),
  type: cellTypeSchema,
  title: z.string().min(1),
  subtitleJa: z.string().nullable().optional(),
  icon: z.string().min(1),
  targetId: z.string().uuid().nullable().optional(),
  targetTable: z.string().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
});

const updateSchema = createSchema.partial().omit({ sheet: true });

const reorderSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.string().uuid(),
        row: z.number().int().min(0),
        col: z.number().int().min(0),
      }),
    )
    .min(1),
});

function serializeCell(row: typeof cells.$inferSelect) {
  return {
    id: row.id,
    sheet: row.sheet,
    row: row.row,
    col: row.col,
    rowSpan: row.rowSpan,
    colSpan: row.colSpan,
    type: row.type,
    title: row.title,
    subtitleJa: row.subtitleJa,
    icon: row.icon,
    targetId: row.targetId,
    targetTable: row.targetTable,
    externalUrl: row.externalUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function registerCellRoutes(app: FastifyInstance) {
  app.get("/api/cells", async (request) => {
    const sheet =
      typeof request.query === "object" &&
      request.query &&
      "sheet" in request.query
        ? String((request.query as { sheet?: string }).sheet ?? DEFAULT_SHEET)
        : DEFAULT_SHEET;
    const rows = await db.select().from(cells).where(eq(cells.sheet, sheet));
    return rows.map(serializeCell);
  });

  app.post("/api/cells", async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    try {
      const [created] = await db
        .insert(cells)
        .values({
          sheet: parsed.data.sheet,
          row: parsed.data.row,
          col: parsed.data.col,
          rowSpan: parsed.data.rowSpan,
          colSpan: parsed.data.colSpan,
          type: parsed.data.type,
          title: parsed.data.title,
          subtitleJa: parsed.data.subtitleJa ?? null,
          icon: parsed.data.icon,
          targetId: parsed.data.targetId ?? null,
          targetTable: parsed.data.targetTable ?? null,
          externalUrl: parsed.data.externalUrl ?? null,
        })
        .returning();
      return reply.code(201).send(serializeCell(created));
    } catch (err) {
      if (err instanceof Error && err.message.includes("duplicate")) {
        return reply
          .code(409)
          .send({ error: "A cell already exists at that position" });
      }
      throw err;
    }
  });

  app.patch("/api/cells/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    const [updated] = await db
      .update(cells)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(cells.id, id))
      .returning();
    if (!updated) {
      return reply.code(404).send({ error: "Cell not found" });
    }
    return serializeCell(updated);
  });

  app.delete("/api/cells/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await db.delete(cells).where(eq(cells.id, id)).returning();
    if (deleted.length === 0) {
      return reply.code(404).send({ error: "Cell not found" });
    }
    return reply.code(204).send();
  });

  app.post("/api/cells/reorder", async (request, reply) => {
    const parsed = reorderSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }
    await db.transaction(async (tx) => {
      for (const update of parsed.data.updates) {
        await tx
          .update(cells)
          .set({
            row: update.row,
            col: update.col,
            updatedAt: new Date(),
          })
          .where(eq(cells.id, update.id));
      }
    });
    return { status: "ok" };
  });
}
```

- [ ] **Step 2: Register the routes in `backend/src/server.ts`**

Replace the file contents:

```typescript
import Fastify from "fastify";
import { env } from "./env.js";
import { registerCellRoutes } from "./routes/cells.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  await registerCellRoutes(fastify);

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Run the tests**

```bash
npm run test --workspace backend
```

Expected: all cells routes tests PASS. Health check still passes.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/cells.ts backend/src/server.ts
git commit -m "feat(backend): implement cells CRUD and reorder routes"
```

---

## Task 9: Add CORS support for frontend dev server

**Files:**
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Update server to register CORS for dev**

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerCellRoutes } from "./routes/cells.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  if (env.NODE_ENV === "development") {
    await fastify.register(cors, {
      origin: "http://localhost:5173",
      credentials: true,
    });
  }

  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  await registerCellRoutes(fastify);

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
```

- [ ] **Step 2: Run tests to verify nothing regressed**

```bash
npm run test --workspace backend
```

Expected: all tests still pass.

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.ts
git commit -m "feat(backend): enable CORS for dev frontend on port 5173"
```

---

## Task 10: Serve the built frontend from Fastify (production mode)

**Files:**
- Create: `backend/src/static.ts`
- Modify: `backend/src/server.ts`

- [ ] **Step 1: Create `backend/src/static.ts`**

```typescript
import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function registerStaticFrontend(app: FastifyInstance) {
  const frontendDist = resolve(__dirname, "../../frontend/dist");

  if (!existsSync(frontendDist)) {
    app.log.warn(
      `Frontend dist not found at ${frontendDist} — skipping static file registration. Run the frontend build first.`,
    );
    return;
  }

  await app.register(fastifyStatic, {
    root: frontendDist,
    prefix: "/",
    wildcard: false,
  });

  // SPA fallback: any non-API route should return index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.code(404).send({ error: "Not found" });
    }
    return reply.sendFile("index.html", frontendDist);
  });
}
```

- [ ] **Step 2: Register it in `backend/src/server.ts`**

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./env.js";
import { registerCellRoutes } from "./routes/cells.js";
import { registerStaticFrontend } from "./static.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  if (env.NODE_ENV === "development") {
    await fastify.register(cors, {
      origin: "http://localhost:5173",
      credentials: true,
    });
  }

  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  await registerCellRoutes(fastify);

  if (env.NODE_ENV === "production") {
    await registerStaticFrontend(fastify);
  }

  return fastify;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await buildServer();
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
```

- [ ] **Step 3: Run tests**

```bash
npm run test --workspace backend
```

Expected: all tests still pass (static registration is production-only, tests run in test env).

- [ ] **Step 4: Commit**

```bash
git add backend/src/static.ts backend/src/server.ts
git commit -m "feat(backend): serve frontend dist in production"
```

---

## Task 11: Create the frontend workspace with Vite + React + TS

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "@cellsite/frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@cellsite/shared": "*",
    "@tanstack/react-query": "^5.51.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^24.1.1",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "outDir": "./dist",
    "rootDir": "./src",
    "noEmit": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

- [ ] **Step 3: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
  },
});
```

- [ ] **Step 4: Create `frontend/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>セルサイト · Cellsite</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `frontend/src/main.tsx`**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Create `frontend/src/App.tsx`**

```typescript
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Cellsite home (placeholder)</div>} />
    </Routes>
  );
}
```

- [ ] **Step 7: Create `frontend/src/index.css`**

```css
:root {
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
}
```

- [ ] **Step 8: Create `frontend/src/test/setup.ts`**

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 9: Install and verify dev server runs**

```bash
npm install
npm run dev --workspace frontend
```

Expected: Vite dev server starts on port 5173. Visit http://localhost:5173 to see "Cellsite home (placeholder)". Kill the server with Ctrl+C after verifying.

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat(frontend): scaffold vite + react + ts + react router + react query"
```

---

## Task 12: Add Tailwind and theme tokens

**Files:**
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/theme/tokens.css`
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Create `frontend/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 2: Create `frontend/tailwind.config.ts`**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-blog": "rgb(var(--color-accent-blog) / <alpha-value>)",
        "accent-gallery": "rgb(var(--color-accent-gallery) / <alpha-value>)",
        "accent-audio": "rgb(var(--color-accent-audio) / <alpha-value>)",
        "accent-document": "rgb(var(--color-accent-document) / <alpha-value>)",
        "accent-presentation": "rgb(var(--color-accent-presentation) / <alpha-value>)",
        "accent-external": "rgb(var(--color-accent-external) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "-apple-system", "sans-serif"],
        jp: ['"Noto Serif JP"', "Segoe UI", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: Create `frontend/src/theme/tokens.css`**

```css
:root {
  /* Light mode (default) — warm washi parchment */
  --color-base: 245 240 232;
  --color-surface: 235 229 217;
  --color-muted: 240 235 226;
  --color-border: 212 205 192;
  --color-text: 58 58 58;
  --color-text-muted: 138 133 120;
  --color-accent: 196 86 58;
  --color-accent-blog: 196 86 58;
  --color-accent-gallery: 58 122 90;
  --color-accent-audio: 138 106 58;
  --color-accent-document: 58 90 138;
  --color-accent-presentation: 138 58 90;
  --color-accent-external: 90 122 58;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode — deep indigo */
    --color-base: 20 20 31;
    --color-surface: 14 14 24;
    --color-muted: 10 10 20;
    --color-border: 34 34 58;
    --color-text: 200 200 208;
    --color-text-muted: 90 90 112;
    --color-accent: 212 117 106;
    --color-accent-blog: 212 117 106;
    --color-accent-gallery: 122 184 148;
    --color-accent-audio: 192 154 106;
    --color-accent-document: 122 150 192;
    --color-accent-presentation: 184 122 150;
    --color-accent-external: 150 184 122;
  }
}

[data-theme="light"] {
  color-scheme: light;
  --color-base: 245 240 232;
  --color-surface: 235 229 217;
  --color-muted: 240 235 226;
  --color-border: 212 205 192;
  --color-text: 58 58 58;
  --color-text-muted: 138 133 120;
  --color-accent: 196 86 58;
  --color-accent-blog: 196 86 58;
  --color-accent-gallery: 58 122 90;
  --color-accent-audio: 138 106 58;
  --color-accent-document: 58 90 138;
  --color-accent-presentation: 138 58 90;
  --color-accent-external: 90 122 58;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-base: 20 20 31;
  --color-surface: 14 14 24;
  --color-muted: 10 10 20;
  --color-border: 34 34 58;
  --color-text: 200 200 208;
  --color-text-muted: 90 90 112;
  --color-accent: 212 117 106;
  --color-accent-blog: 212 117 106;
  --color-accent-gallery: 122 184 148;
  --color-accent-audio: 192 154 106;
  --color-accent-document: 122 150 192;
  --color-accent-presentation: 184 122 150;
  --color-accent-external: 150 184 122;
}
```

- [ ] **Step 4: Replace `frontend/src/index.css` with Tailwind entry**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "./theme/tokens.css";

html, body, #root {
  height: 100%;
  margin: 0;
}

body {
  background-color: rgb(var(--color-base));
  color: rgb(var(--color-text));
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 5: Verify Tailwind classes render correctly**

Update `frontend/src/App.tsx` temporarily to use a theme color:

```typescript
import { Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-8 bg-surface text-text min-h-screen">
            <h1 className="text-accent text-2xl font-semibold">
              セルサイト — theme test
            </h1>
          </div>
        }
      />
    </Routes>
  );
}
```

```bash
npm run dev --workspace frontend
```

Expected: the page renders with warm parchment background and vermillion heading in light mode, deep indigo/vermillion in dark mode (toggle OS theme to confirm). Kill the server.

- [ ] **Step 6: Commit**

```bash
git add frontend/tailwind.config.ts frontend/postcss.config.js frontend/src/theme/ frontend/src/index.css frontend/src/App.tsx
git commit -m "feat(frontend): add tailwind and japanese art theme tokens for light and dark modes"
```

---

## Task 13: Add the ThemeProvider component

**Files:**
- Create: `frontend/src/theme/ThemeProvider.tsx`
- Create: `frontend/src/theme/ThemeProvider.test.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider.js";

describe("ThemeProvider", () => {
  it("renders children", () => {
    render(
      <ThemeProvider>
        <div>child content</div>
      </ThemeProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("sets data-theme on the document element", () => {
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    const theme = document.documentElement.getAttribute("data-theme");
    expect(theme === "light" || theme === "dark").toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm run test --workspace frontend
```

Expected: FAIL (`ThemeProvider` doesn't exist yet).

- [ ] **Step 3: Implement `frontend/src/theme/ThemeProvider.tsx`**

```typescript
import { useEffect, type ReactNode } from "react";

function getPreferredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute("data-theme", getPreferredTheme());
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 4: Run the test**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Wrap the app with ThemeProvider in `frontend/src/main.tsx`**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App.js";
import { ThemeProvider } from "./theme/ThemeProvider.js";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/theme/ThemeProvider.tsx frontend/src/theme/ThemeProvider.test.tsx frontend/src/main.tsx
git commit -m "feat(frontend): add ThemeProvider that follows prefers-color-scheme"
```

---

## Task 14: Add the API client

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/cells.ts`

- [ ] **Step 1: Create `frontend/src/lib/api.ts`**

```typescript
const API_BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      (data as { error?: string }).error ?? `Request failed: ${response.status}`,
    );
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
```

- [ ] **Step 2: Create `frontend/src/lib/cells.ts`**

```typescript
import type {
  Cell,
  CellCreateInput,
  CellUpdateInput,
  CellReorderInput,
} from "@cellsite/shared";
import { api } from "./api.js";

export const cellsApi = {
  list: (sheet = "creative") =>
    api.get<Cell[]>(`/cells?sheet=${encodeURIComponent(sheet)}`),
  create: (input: CellCreateInput) => api.post<Cell>("/cells", input),
  update: (id: string, input: CellUpdateInput) =>
    api.patch<Cell>(`/cells/${id}`, input),
  delete: (id: string) => api.delete<void>(`/cells/${id}`),
  reorder: (updates: CellReorderInput[]) =>
    api.post<{ status: string }>("/cells/reorder", { updates }),
};
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck --workspace frontend
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/
git commit -m "feat(frontend): add api client and typed cells api module"
```

---

## Task 15: Add the edit-mode store (Zustand)

**Files:**
- Create: `frontend/src/spreadsheet/useEditMode.ts`
- Create: `frontend/src/spreadsheet/useEditMode.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useEditMode } from "./useEditMode.js";

describe("useEditMode", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
  });

  it("starts disabled", () => {
    expect(useEditMode.getState().enabled).toBe(false);
  });

  it("toggles on", () => {
    useEditMode.getState().toggle();
    expect(useEditMode.getState().enabled).toBe(true);
  });

  it("toggles off", () => {
    useEditMode.getState().toggle();
    useEditMode.getState().toggle();
    expect(useEditMode.getState().enabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm run test --workspace frontend
```

Expected: FAIL (module does not exist).

- [ ] **Step 3: Implement `frontend/src/spreadsheet/useEditMode.ts`**

```typescript
import { create } from "zustand";

interface EditModeState {
  enabled: boolean;
  toggle: () => void;
  set: (enabled: boolean) => void;
}

export const useEditMode = create<EditModeState>((set) => ({
  enabled: false,
  toggle: () => set((state) => ({ enabled: !state.enabled })),
  set: (enabled) => set({ enabled }),
}));
```

- [ ] **Step 4: Run the test**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/spreadsheet/useEditMode.ts frontend/src/spreadsheet/useEditMode.test.ts
git commit -m "feat(frontend): add edit mode zustand store"
```

---

## Task 16: Add the hovered-cell store

**Files:**
- Create: `frontend/src/spreadsheet/useHoveredCell.ts`

- [ ] **Step 1: Implement `frontend/src/spreadsheet/useHoveredCell.ts`**

```typescript
import { create } from "zustand";
import type { Cell } from "@cellsite/shared";

interface HoveredCellState {
  hovered: Cell | null;
  hoveredPosition: { row: number; col: number } | null;
  setHoveredCell: (cell: Cell | null) => void;
  setHoveredPosition: (pos: { row: number; col: number } | null) => void;
}

export const useHoveredCell = create<HoveredCellState>((set) => ({
  hovered: null,
  hoveredPosition: null,
  setHoveredCell: (hovered) => set({ hovered }),
  setHoveredPosition: (hoveredPosition) => set({ hoveredPosition }),
}));
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck --workspace frontend
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/spreadsheet/useHoveredCell.ts
git commit -m "feat(frontend): add hovered cell store for formula bar"
```

---

## Task 17: Build the Ribbon component (failing test → impl)

**Files:**
- Create: `frontend/src/spreadsheet/Ribbon.tsx`
- Create: `frontend/src/spreadsheet/Ribbon.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Ribbon } from "./Ribbon.js";
import { useEditMode } from "./useEditMode.js";

describe("Ribbon", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
  });

  it("renders the site name in katakana", () => {
    render(<Ribbon />);
    expect(screen.getByText("セルサイト")).toBeInTheDocument();
  });

  it("renders nav tabs", () => {
    render(<Ribbon />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
  });

  it("renders an edit mode toggle that toggles the store", async () => {
    const user = userEvent.setup();
    render(<Ribbon />);
    const button = screen.getByRole("button", { name: /edit/i });
    expect(useEditMode.getState().enabled).toBe(false);
    await user.click(button);
    expect(useEditMode.getState().enabled).toBe(true);
  });
});
```

- [ ] **Step 2: Run test — expect failure**

```bash
npm run test --workspace frontend
```

Expected: FAIL (no Ribbon component).

- [ ] **Step 3: Implement `frontend/src/spreadsheet/Ribbon.tsx`**

```typescript
import { useEditMode } from "./useEditMode.js";

const NAV_TABS = ["Home", "Content", "About", "Contact"] as const;

export function Ribbon() {
  const editMode = useEditMode();

  return (
    <header className="flex items-center gap-4 bg-surface border-b border-border px-4 py-2 text-sm">
      <span className="font-jp font-semibold text-accent text-base">
        セルサイト
      </span>
      <nav className="flex gap-1 flex-1">
        {NAV_TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            className={`px-3 py-1 transition-colors ${
              i === 0
                ? "text-text border-b-2 border-accent"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      <button
        type="button"
        onClick={editMode.toggle}
        className={`px-3 py-1 rounded border border-border text-xs transition-colors ${
          editMode.enabled
            ? "bg-accent text-base"
            : "bg-muted text-text-muted hover:text-text"
        }`}
      >
        {editMode.enabled ? "Exit Edit Mode" : "Edit"}
      </button>
    </header>
  );
}
```

- [ ] **Step 4: Run test**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/spreadsheet/Ribbon.tsx frontend/src/spreadsheet/Ribbon.test.tsx
git commit -m "feat(frontend): add Ribbon component with nav tabs and edit toggle"
```

---

## Task 18: Build the FormulaBar component

**Files:**
- Create: `frontend/src/spreadsheet/FormulaBar.tsx`
- Create: `frontend/src/spreadsheet/FormulaBar.test.tsx`
- Create: `frontend/src/spreadsheet/cellRef.ts`
- Create: `frontend/src/spreadsheet/cellRef.test.ts`

- [ ] **Step 1: Write failing test for cellRef helper**

```typescript
import { describe, it, expect } from "vitest";
import { colLetter, cellRef } from "./cellRef.js";

describe("cellRef", () => {
  it("colLetter returns A for col 0", () => {
    expect(colLetter(0)).toBe("A");
  });

  it("colLetter returns Z for col 25", () => {
    expect(colLetter(25)).toBe("Z");
  });

  it("colLetter returns AA for col 26", () => {
    expect(colLetter(26)).toBe("AA");
  });

  it("cellRef formats row+col as spreadsheet-style", () => {
    expect(cellRef(0, 0)).toBe("A1");
    expect(cellRef(1, 1)).toBe("B2");
    expect(cellRef(9, 2)).toBe("C10");
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test --workspace frontend
```

Expected: FAIL.

- [ ] **Step 3: Implement `frontend/src/spreadsheet/cellRef.ts`**

```typescript
export function colLetter(col: number): string {
  let result = "";
  let n = col;
  while (n >= 0) {
    result = String.fromCharCode((n % 26) + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function cellRef(row: number, col: number): string {
  return `${colLetter(col)}${row + 1}`;
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Write failing FormulaBar test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormulaBar } from "./FormulaBar.js";
import { useHoveredCell } from "./useHoveredCell.js";
import type { Cell } from "@cellsite/shared";

function makeCell(overrides: Partial<Cell> = {}): Cell {
  return {
    id: "c1",
    sheet: "creative",
    row: 1,
    col: 1,
    rowSpan: 1,
    colSpan: 1,
    type: "external",
    title: "Example",
    subtitleJa: "例",
    icon: "⭐",
    targetId: null,
    targetTable: null,
    externalUrl: "https://example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("FormulaBar", () => {
  beforeEach(() => {
    useHoveredCell.setState({ hovered: null, hoveredPosition: null });
  });

  it("shows empty state when no cell is hovered", () => {
    render(<FormulaBar />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows the hovered cell's reference and title", () => {
    useHoveredCell.setState({
      hovered: makeCell({ row: 1, col: 1, title: "Example", subtitleJa: "例" }),
      hoveredPosition: { row: 1, col: 1 },
    });
    render(<FormulaBar />);
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText(/Example/)).toBeInTheDocument();
  });

  it("shows just the cell ref when hovering an empty position", () => {
    useHoveredCell.setState({
      hovered: null,
      hoveredPosition: { row: 2, col: 3 },
    });
    render(<FormulaBar />);
    expect(screen.getByText("D3")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run — expect fail**

```bash
npm run test --workspace frontend
```

Expected: FAIL.

- [ ] **Step 7: Implement `frontend/src/spreadsheet/FormulaBar.tsx`**

```typescript
import { useHoveredCell } from "./useHoveredCell.js";
import { cellRef } from "./cellRef.js";

export function FormulaBar() {
  const { hovered, hoveredPosition } = useHoveredCell();
  const ref = hoveredPosition
    ? cellRef(hoveredPosition.row, hoveredPosition.col)
    : "—";

  const display = hovered
    ? `${hovered.title}${hovered.subtitleJa ? ` — ${hovered.subtitleJa}` : ""}`
    : "";

  return (
    <div className="flex items-center gap-2 bg-muted border-b border-border px-3 py-1 text-xs font-mono">
      <span className="inline-block min-w-[2.5rem] bg-surface border border-border rounded-sm px-2 py-[1px] text-accent text-center">
        {ref}
      </span>
      <span className="text-text-muted italic px-1">fx</span>
      <span className="text-text-muted flex-1 truncate">{display}</span>
    </div>
  );
}
```

- [ ] **Step 8: Run tests**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/spreadsheet/cellRef.ts frontend/src/spreadsheet/cellRef.test.ts frontend/src/spreadsheet/FormulaBar.tsx frontend/src/spreadsheet/FormulaBar.test.tsx
git commit -m "feat(frontend): add cellRef helper and FormulaBar component"
```

---

## Task 19: Build the SheetTabs component (decorative)

**Files:**
- Create: `frontend/src/spreadsheet/SheetTabs.tsx`

- [ ] **Step 1: Implement `frontend/src/spreadsheet/SheetTabs.tsx`**

```typescript
export function SheetTabs() {
  return (
    <div className="flex gap-0.5 bg-surface border-t border-border px-2 py-1 text-xs">
      <span className="bg-base border border-border border-b-0 rounded-t-md px-3 py-1 text-accent">
        Creative
      </span>
      <span className="text-text-muted px-3 py-1 cursor-not-allowed">
        Writing
      </span>
      <span className="text-text-muted px-3 py-1 cursor-not-allowed">Code</span>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck --workspace frontend
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/spreadsheet/SheetTabs.tsx
git commit -m "feat(frontend): add decorative SheetTabs component"
```

---

## Task 20: Build the Cell component (read mode only)

**Files:**
- Create: `frontend/src/spreadsheet/Cell.tsx`
- Create: `frontend/src/spreadsheet/Cell.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Cell } from "./Cell.js";
import { useEditMode } from "./useEditMode.js";
import type { Cell as CellType } from "@cellsite/shared";

function makeCell(overrides: Partial<CellType> = {}): CellType {
  return {
    id: "c1",
    sheet: "creative",
    row: 0,
    col: 0,
    rowSpan: 1,
    colSpan: 1,
    type: "external",
    title: "GitHub",
    subtitleJa: "コード",
    icon: "🐙",
    targetId: null,
    targetTable: null,
    externalUrl: "https://github.com/example",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Cell (read mode)", () => {
  beforeEach(() => {
    useEditMode.setState({ enabled: false });
  });

  it("renders title, subtitle, and icon", () => {
    render(<Cell cell={makeCell()} onClick={() => {}} onHover={() => {}} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("コード")).toBeInTheDocument();
    expect(screen.getByText("🐙")).toBeInTheDocument();
  });

  it("calls onClick when clicked in read mode", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Cell cell={makeCell()} onClick={onClick} onHover={() => {}} />);
    await user.click(screen.getByText("GitHub"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("calls onHover with the cell on mouseEnter", async () => {
    const user = userEvent.setup();
    const onHover = vi.fn();
    render(<Cell cell={makeCell()} onClick={() => {}} onHover={onHover} />);
    await user.hover(screen.getByText("GitHub"));
    expect(onHover).toHaveBeenCalledWith(expect.objectContaining({ title: "GitHub" }));
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test --workspace frontend
```

Expected: FAIL.

- [ ] **Step 3: Implement `frontend/src/spreadsheet/Cell.tsx`**

```typescript
import type { Cell as CellData, CellType } from "@cellsite/shared";
import { useEditMode } from "./useEditMode.js";

interface CellProps {
  cell: CellData;
  onClick: (cell: CellData) => void;
  onHover: (cell: CellData | null) => void;
  onDoubleClick?: (cell: CellData) => void;
}

const ACCENT_CLASS: Record<CellType, string> = {
  blog: "text-accent-blog",
  gallery: "text-accent-gallery",
  audio: "text-accent-audio",
  document: "text-accent-document",
  presentation: "text-accent-presentation",
  external: "text-accent-external",
};

const GRADIENT_CLASS: Record<CellType, string> = {
  blog: "bg-gradient-to-br from-[rgb(var(--color-accent-blog)/0.08)] to-transparent",
  gallery: "bg-gradient-to-br from-[rgb(var(--color-accent-gallery)/0.08)] to-transparent",
  audio: "bg-gradient-to-br from-[rgb(var(--color-accent-audio)/0.08)] to-transparent",
  document: "bg-gradient-to-br from-[rgb(var(--color-accent-document)/0.08)] to-transparent",
  presentation: "bg-gradient-to-br from-[rgb(var(--color-accent-presentation)/0.08)] to-transparent",
  external: "bg-gradient-to-br from-[rgb(var(--color-accent-external)/0.08)] to-transparent",
};

export function Cell({ cell, onClick, onHover, onDoubleClick }: CellProps) {
  const editMode = useEditMode();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(cell)}
      onDoubleClick={() => onDoubleClick?.(cell)}
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick(cell);
      }}
      className={`
        border-r border-b border-border cursor-pointer
        flex flex-col items-center justify-center text-center
        px-2 py-3 min-h-[90px]
        ${GRADIENT_CLASS[cell.type]}
        ${editMode.enabled ? "outline-dashed outline-1 outline-accent/50" : ""}
        hover:brightness-110 transition-all
      `}
      style={{
        gridColumn: `span ${cell.colSpan}`,
        gridRow: `span ${cell.rowSpan}`,
      }}
      data-cell-id={cell.id}
    >
      <div className="text-xl mb-1 opacity-90">{cell.icon}</div>
      <div className={`font-medium ${ACCENT_CLASS[cell.type]}`}>
        {cell.title}
      </div>
      {cell.subtitleJa && (
        <div className="text-[10px] text-text-muted mt-0.5 font-jp">
          {cell.subtitleJa}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/spreadsheet/Cell.tsx frontend/src/spreadsheet/Cell.test.tsx
git commit -m "feat(frontend): add Cell component with read-mode rendering and hover/click"
```

---

## Task 21: Build the Grid component with column/row headers

**Files:**
- Create: `frontend/src/spreadsheet/Grid.tsx`
- Create: `frontend/src/spreadsheet/Grid.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Grid } from "./Grid.js";
import type { Cell } from "@cellsite/shared";

function makeCell(row: number, col: number, title: string): Cell {
  return {
    id: `cell-${row}-${col}`,
    sheet: "creative",
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
    type: "external",
    title,
    subtitleJa: null,
    icon: "⭐",
    targetId: null,
    targetTable: null,
    externalUrl: "https://example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("Grid", () => {
  it("renders column headers A through J by default", () => {
    render(
      <Grid
        cells={[]}
        cols={10}
        rows={5}
        onCellClick={() => {}}
        onCellHover={() => {}}
        onEmptyDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders row numbers 1 through rows count", () => {
    render(
      <Grid
        cells={[]}
        cols={5}
        rows={3}
        onCellClick={() => {}}
        onCellHover={() => {}}
        onEmptyDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders configured cells", () => {
    const cells = [makeCell(0, 0, "Cell A1"), makeCell(1, 2, "Cell C2")];
    render(
      <Grid
        cells={cells}
        cols={5}
        rows={3}
        onCellClick={() => {}}
        onCellHover={() => {}}
        onEmptyDoubleClick={() => {}}
      />,
    );
    expect(screen.getByText("Cell A1")).toBeInTheDocument();
    expect(screen.getByText("Cell C2")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test --workspace frontend
```

Expected: FAIL.

- [ ] **Step 3: Implement `frontend/src/spreadsheet/Grid.tsx`**

```typescript
import type { Cell as CellData } from "@cellsite/shared";
import { Cell } from "./Cell.js";
import { colLetter } from "./cellRef.js";
import { useEditMode } from "./useEditMode.js";

interface GridProps {
  cells: CellData[];
  cols: number;
  rows: number;
  onCellClick: (cell: CellData) => void;
  onCellDoubleClick?: (cell: CellData) => void;
  onCellHover: (cell: CellData | null, pos: { row: number; col: number } | null) => void;
  onEmptyDoubleClick: (row: number, col: number) => void;
}

export function Grid({
  cells,
  cols,
  rows,
  onCellClick,
  onCellDoubleClick,
  onCellHover,
  onEmptyDoubleClick,
}: GridProps) {
  const editMode = useEditMode();

  // Build a map of (row,col) → cell to cover its full span
  const occupied = new Map<string, CellData>();
  const topLeft = new Map<string, CellData>();
  for (const cell of cells) {
    topLeft.set(`${cell.row},${cell.col}`, cell);
    for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
      for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
        occupied.set(`${r},${c}`, cell);
      }
    }
  }

  const gridTemplateColumns = `32px repeat(${cols}, minmax(120px, 1fr))`;

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns,
          gridAutoRows: "minmax(90px, auto)",
        }}
      >
        {/* Empty corner */}
        <div className="bg-surface border-r border-b border-border sticky top-0 left-0 z-20 h-7" />

        {/* Column headers */}
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={`col-${c}`}
            className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky top-0 z-10 h-7 flex items-center justify-center"
          >
            {colLetter(c)}
          </div>
        ))}

        {/* Rows */}
        {Array.from({ length: rows }, (_, r) => (
          <RowContent
            key={`row-${r}`}
            row={r}
            cols={cols}
            occupied={occupied}
            topLeft={topLeft}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            onCellHover={onCellHover}
            onEmptyDoubleClick={onEmptyDoubleClick}
            editModeEnabled={editMode.enabled}
          />
        ))}
      </div>
    </div>
  );
}

interface RowContentProps {
  row: number;
  cols: number;
  occupied: Map<string, CellData>;
  topLeft: Map<string, CellData>;
  onCellClick: (cell: CellData) => void;
  onCellDoubleClick?: (cell: CellData) => void;
  onCellHover: (cell: CellData | null, pos: { row: number; col: number } | null) => void;
  onEmptyDoubleClick: (row: number, col: number) => void;
  editModeEnabled: boolean;
}

function RowContent({
  row,
  cols,
  occupied,
  topLeft,
  onCellClick,
  onCellDoubleClick,
  onCellHover,
  onEmptyDoubleClick,
  editModeEnabled,
}: RowContentProps) {
  const elements: JSX.Element[] = [];

  // Row number
  elements.push(
    <div
      key={`rownum-${row}`}
      className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky left-0 z-10 flex items-center justify-center"
    >
      {row + 1}
    </div>,
  );

  for (let c = 0; c < cols; c++) {
    const key = `${row},${c}`;
    const occ = occupied.get(key);
    if (occ && topLeft.get(key) === occ) {
      elements.push(
        <Cell
          key={`cell-${occ.id}`}
          cell={occ}
          onClick={onCellClick}
          onDoubleClick={onCellDoubleClick}
          onHover={(c) => onCellHover(c, { row, col: c?.col ?? 0 })}
        />,
      );
    } else if (!occ) {
      elements.push(
        <div
          key={`empty-${row}-${c}`}
          className={`
            border-r border-b border-border bg-muted min-h-[90px]
            ${editModeEnabled ? "outline-dashed outline-1 outline-border cursor-cell" : ""}
          `}
          onMouseEnter={() => onCellHover(null, { row, col: c })}
          onMouseLeave={() => onCellHover(null, null)}
          onDoubleClick={() => editModeEnabled && onEmptyDoubleClick(row, c)}
          data-row={row}
          data-col={c}
        />,
      );
    }
    // If occupied but not top-left, skip (already spanned)
  }

  return <>{elements}</>;
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/spreadsheet/Grid.tsx frontend/src/spreadsheet/Grid.test.tsx
git commit -m "feat(frontend): add Grid with column/row headers and cell span support"
```

---

## Task 22: Build the SpreadsheetPage and wire up data loading

**Files:**
- Create: `frontend/src/spreadsheet/SpreadsheetPage.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Implement `frontend/src/spreadsheet/SpreadsheetPage.tsx`**

```typescript
import { useQuery } from "@tanstack/react-query";
import { cellsApi } from "../lib/cells.js";
import { DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS } from "@cellsite/shared";
import { Ribbon } from "./Ribbon.js";
import { FormulaBar } from "./FormulaBar.js";
import { SheetTabs } from "./SheetTabs.js";
import { Grid } from "./Grid.js";
import { useHoveredCell } from "./useHoveredCell.js";
import type { Cell } from "@cellsite/shared";

export function SpreadsheetPage() {
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", "creative"],
    queryFn: () => cellsApi.list("creative"),
  });

  const handleCellClick = (cell: Cell) => {
    // Placeholder — expand-in-place comes in Task 23
    console.log("clicked cell", cell);
  };

  const handleCellHover = (
    cell: Cell | null,
    pos: { row: number; col: number } | null,
  ) => {
    setHoveredCell(cell);
    setHoveredPosition(pos);
  };

  const handleEmptyDoubleClick = (row: number, col: number) => {
    // Wired in Task 26
    console.log("empty double-click", row, col);
  };

  return (
    <div className="flex flex-col h-screen bg-base text-text">
      <Ribbon />
      <FormulaBar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading grid…
        </div>
      ) : (
        <Grid
          cells={cells}
          cols={DEFAULT_GRID_COLS}
          rows={DEFAULT_GRID_ROWS}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
          onEmptyDoubleClick={handleEmptyDoubleClick}
        />
      )}
      <SheetTabs />
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/App.tsx` to route home to SpreadsheetPage**

```typescript
import { Routes, Route } from "react-router-dom";
import { SpreadsheetPage } from "./spreadsheet/SpreadsheetPage.js";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SpreadsheetPage />} />
    </Routes>
  );
}
```

- [ ] **Step 3: Run backend and frontend dev servers**

In one terminal:
```bash
npm run dev --workspace backend
```

In another terminal:
```bash
npm run dev --workspace frontend
```

Visit http://localhost:5173. Expected: empty grid with ribbon, formula bar, column headers A–J, row numbers 1–20, sheet tabs. Hovering an empty position shows its reference in the formula bar.

- [ ] **Step 4: Kill both servers**

Ctrl+C in both terminals.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/spreadsheet/SpreadsheetPage.tsx frontend/src/App.tsx
git commit -m "feat(frontend): wire SpreadsheetPage with ribbon, formula bar, grid, sheet tabs"
```

---

## Task 23: Add the ExpandedCell overlay for click-to-preview

**Files:**
- Create: `frontend/src/spreadsheet/ExpandedCell.tsx`
- Modify: `frontend/src/spreadsheet/SpreadsheetPage.tsx`

- [ ] **Step 1: Implement `frontend/src/spreadsheet/ExpandedCell.tsx`**

```typescript
import { useEffect } from "react";
import type { Cell } from "@cellsite/shared";

interface ExpandedCellProps {
  cell: Cell;
  onClose: () => void;
  onOpen: (cell: Cell) => void;
}

export function ExpandedCell({ cell, onClose, onOpen }: ExpandedCellProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-base/80 backdrop-blur-sm z-30 flex items-center justify-center p-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-surface border border-border rounded-lg max-w-lg w-full p-8 shadow-2xl animate-[expand_180ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl text-center mb-4">{cell.icon}</div>
        <h2 className="text-accent text-2xl font-medium text-center">
          {cell.title}
        </h2>
        {cell.subtitleJa && (
          <p className="text-text-muted text-center font-jp mt-1">
            {cell.subtitleJa}
          </p>
        )}
        <div className="text-text text-sm text-center mt-6">
          {cell.type === "external" && cell.externalUrl ? (
            <span className="text-text-muted break-all">{cell.externalUrl}</span>
          ) : (
            <span className="text-text-muted italic">
              Content type: {cell.type}
            </span>
          )}
        </div>
        <div className="flex gap-2 justify-center mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded text-text-muted hover:text-text"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onOpen(cell)}
            className="px-4 py-2 bg-accent text-base rounded font-medium"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add an expand animation to `frontend/src/index.css`**

Append:

```css
@keyframes expand {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

- [ ] **Step 3: Wire ExpandedCell into `SpreadsheetPage.tsx`**

Replace the file contents with:

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cellsApi } from "../lib/cells.js";
import { DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS } from "@cellsite/shared";
import { Ribbon } from "./Ribbon.js";
import { FormulaBar } from "./FormulaBar.js";
import { SheetTabs } from "./SheetTabs.js";
import { Grid } from "./Grid.js";
import { ExpandedCell } from "./ExpandedCell.js";
import { useHoveredCell } from "./useHoveredCell.js";
import type { Cell } from "@cellsite/shared";

export function SpreadsheetPage() {
  const [expanded, setExpanded] = useState<Cell | null>(null);
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", "creative"],
    queryFn: () => cellsApi.list("creative"),
  });

  const handleCellClick = (cell: Cell) => {
    setExpanded(cell);
  };

  const handleCellHover = (
    cell: Cell | null,
    pos: { row: number; col: number } | null,
  ) => {
    setHoveredCell(cell);
    setHoveredPosition(pos);
  };

  const handleEmptyDoubleClick = (row: number, col: number) => {
    console.log("empty double-click", row, col); // wired in Task 26
  };

  const handleOpen = (cell: Cell) => {
    if (cell.type === "external" && cell.externalUrl) {
      window.open(cell.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-base text-text">
      <Ribbon />
      <FormulaBar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading grid…
        </div>
      ) : (
        <Grid
          cells={cells}
          cols={DEFAULT_GRID_COLS}
          rows={DEFAULT_GRID_ROWS}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
          onEmptyDoubleClick={handleEmptyDoubleClick}
        />
      )}
      <SheetTabs />
      {expanded && (
        <ExpandedCell
          cell={expanded}
          onClose={() => setExpanded(null)}
          onOpen={handleOpen}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Manually verify with dev servers**

```bash
npm run dev --workspace backend
```

```bash
npm run dev --workspace frontend
```

(In practice, you need a cell to click. Create one manually:)

```bash
curl -X POST http://localhost:3000/api/cells \
  -H "Content-Type: application/json" \
  -d '{"row":0,"col":0,"type":"external","title":"GitHub","subtitleJa":"コード","icon":"🐙","externalUrl":"https://github.com"}'
```

Reload http://localhost:5173, click the cell. Expected: expanded card with GitHub info, Close button closes it, Open button opens github.com in a new tab, Escape closes it.

Kill both dev servers.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/spreadsheet/ExpandedCell.tsx frontend/src/spreadsheet/SpreadsheetPage.tsx frontend/src/index.css
git commit -m "feat(frontend): add ExpandedCell overlay with open/close and escape key"
```

---

## Task 24: Write CellConfigPopover component (create + edit form)

**Files:**
- Create: `frontend/src/editors/CellConfigPopover.tsx`
- Create: `frontend/src/editors/CellConfigPopover.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CellConfigPopover } from "./CellConfigPopover.js";

describe("CellConfigPopover", () => {
  it("renders the title, type dropdown, external url, and save/cancel", () => {
    render(
      <CellConfigPopover
        position={{ row: 0, col: 0 }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/external url/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onSave with a valid external cell payload", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <CellConfigPopover
        position={{ row: 2, col: 3 }}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/title/i), "GitHub");
    await user.type(screen.getByLabelText(/japanese/i), "コード");
    await user.type(
      screen.getByLabelText(/external url/i),
      "https://github.com",
    );
    await user.selectOptions(screen.getByLabelText(/icon/i), "🐙");

    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        row: 2,
        col: 3,
        type: "external",
        title: "GitHub",
        subtitleJa: "コード",
        icon: "🐙",
        externalUrl: "https://github.com",
        rowSpan: 1,
        colSpan: 1,
      }),
    );
  });

  it("calls onCancel when cancel clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <CellConfigPopover
        position={{ row: 0, col: 0 }}
        onSave={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("renders a delete button when editing an existing cell", () => {
    render(
      <CellConfigPopover
        position={{ row: 0, col: 0 }}
        cell={{
          id: "c1",
          sheet: "creative",
          row: 0,
          col: 0,
          rowSpan: 1,
          colSpan: 1,
          type: "external",
          title: "GitHub",
          subtitleJa: null,
          icon: "🐙",
          targetId: null,
          targetTable: null,
          externalUrl: "https://github.com",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect fail**

```bash
npm run test --workspace frontend
```

Expected: FAIL.

- [ ] **Step 3: Implement `frontend/src/editors/CellConfigPopover.tsx`**

```typescript
import { useState, type FormEvent } from "react";
import type { Cell, CellCreateInput, CellType } from "@cellsite/shared";
import { CELL_TYPES } from "@cellsite/shared";

const ICONS = ["🖊️", "🎨", "🎵", "📄", "📊", "✨", "🐙", "⭐", "💡", "🔗", "📚", "🎬"];

interface CellConfigPopoverProps {
  position: { row: number; col: number };
  cell?: Cell;
  onSave: (input: CellCreateInput) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function CellConfigPopover({
  position,
  cell,
  onSave,
  onCancel,
  onDelete,
}: CellConfigPopoverProps) {
  const [title, setTitle] = useState(cell?.title ?? "");
  const [subtitleJa, setSubtitleJa] = useState(cell?.subtitleJa ?? "");
  const [type, setType] = useState<CellType>(cell?.type ?? "external");
  const [icon, setIcon] = useState(cell?.icon ?? ICONS[0]);
  const [externalUrl, setExternalUrl] = useState(cell?.externalUrl ?? "");
  const [rowSpan, setRowSpan] = useState(cell?.rowSpan ?? 1);
  const [colSpan, setColSpan] = useState(cell?.colSpan ?? 1);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      row: position.row,
      col: position.col,
      rowSpan,
      colSpan,
      type,
      title,
      subtitleJa: subtitleJa || null,
      icon,
      externalUrl: type === "external" ? externalUrl : null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-base/60 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-border rounded-lg p-6 w-full max-w-md shadow-2xl"
      >
        <h3 className="text-text text-lg font-medium mb-4">
          {cell ? "Edit Cell" : "Configure Cell"}
        </h3>
        <div className="space-y-3 text-sm">
          <label className="block">
            <span className="text-text-muted">Type</span>
            <select
              aria-label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as CellType)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
            >
              {CELL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-text-muted">Title</span>
            <input
              aria-label="Title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
            />
          </label>

          <label className="block">
            <span className="text-text-muted">Japanese subtitle (optional)</span>
            <input
              aria-label="Japanese subtitle"
              type="text"
              value={subtitleJa}
              onChange={(e) => setSubtitleJa(e.target.value)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text font-jp"
            />
          </label>

          <label className="block">
            <span className="text-text-muted">Icon</span>
            <select
              aria-label="Icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
            >
              {ICONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>

          {type === "external" && (
            <label className="block">
              <span className="text-text-muted">External URL</span>
              <input
                aria-label="External URL"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
                placeholder="https://..."
              />
            </label>
          )}

          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="text-text-muted">Col span</span>
              <input
                aria-label="Column span"
                type="number"
                min={1}
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value))}
                className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
              />
            </label>
            <label className="block flex-1">
              <span className="text-text-muted">Row span</span>
              <input
                aria-label="Row span"
                type="number"
                min={1}
                value={rowSpan}
                onChange={(e) => setRowSpan(Number(e.target.value))}
                className="w-full mt-1 bg-base border border-border rounded px-2 py-1 text-text"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 border border-border rounded text-text-muted hover:text-accent mr-auto"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded text-text-muted hover:text-text"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-base rounded font-medium"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test --workspace frontend
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/editors/CellConfigPopover.tsx frontend/src/editors/CellConfigPopover.test.tsx
git commit -m "feat(frontend): add CellConfigPopover form for create and edit"
```

---

## Task 25: Wire CellConfigPopover into SpreadsheetPage (create + edit + delete)

**Files:**
- Modify: `frontend/src/spreadsheet/SpreadsheetPage.tsx`

- [ ] **Step 1: Update `SpreadsheetPage.tsx` to manage popover state and mutations**

Replace the file contents:

```typescript
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { cellsApi } from "../lib/cells.js";
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
} from "@cellsite/shared";
import type { Cell, CellCreateInput } from "@cellsite/shared";
import { Ribbon } from "./Ribbon.js";
import { FormulaBar } from "./FormulaBar.js";
import { SheetTabs } from "./SheetTabs.js";
import { Grid } from "./Grid.js";
import { ExpandedCell } from "./ExpandedCell.js";
import { CellConfigPopover } from "../editors/CellConfigPopover.js";
import { useHoveredCell } from "./useHoveredCell.js";
import { useEditMode } from "./useEditMode.js";

type PopoverState =
  | { mode: "create"; position: { row: number; col: number } }
  | { mode: "edit"; cell: Cell }
  | null;

export function SpreadsheetPage() {
  const [expanded, setExpanded] = useState<Cell | null>(null);
  const [popover, setPopover] = useState<PopoverState>(null);
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();
  const editMode = useEditMode();
  const queryClient = useQueryClient();

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", "creative"],
    queryFn: () => cellsApi.list("creative"),
  });

  const createMutation = useMutation({
    mutationFn: (input: CellCreateInput) => cellsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CellCreateInput }) =>
      cellsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cellsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const handleCellClick = (cell: Cell) => {
    if (editMode.enabled) return;
    setExpanded(cell);
  };

  const handleCellDoubleClick = (cell: Cell) => {
    if (!editMode.enabled) return;
    setPopover({ mode: "edit", cell });
  };

  const handleEmptyDoubleClick = (row: number, col: number) => {
    if (!editMode.enabled) return;
    setPopover({ mode: "create", position: { row, col } });
  };

  const handleCellHover = (
    cell: Cell | null,
    pos: { row: number; col: number } | null,
  ) => {
    setHoveredCell(cell);
    setHoveredPosition(pos);
  };

  const handleOpen = (cell: Cell) => {
    if (cell.type === "external" && cell.externalUrl) {
      window.open(cell.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSave = (input: CellCreateInput) => {
    if (popover?.mode === "edit") {
      updateMutation.mutate({ id: popover.cell.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  const handleDelete = () => {
    if (popover?.mode === "edit") {
      deleteMutation.mutate(popover.cell.id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-base text-text">
      <Ribbon />
      <FormulaBar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading grid…
        </div>
      ) : (
        <Grid
          cells={cells}
          cols={DEFAULT_GRID_COLS}
          rows={DEFAULT_GRID_ROWS}
          onCellClick={handleCellClick}
          onCellDoubleClick={handleCellDoubleClick}
          onCellHover={handleCellHover}
          onEmptyDoubleClick={handleEmptyDoubleClick}
        />
      )}
      <SheetTabs />
      {expanded && (
        <ExpandedCell
          cell={expanded}
          onClose={() => setExpanded(null)}
          onOpen={handleOpen}
        />
      )}
      {popover?.mode === "create" && (
        <CellConfigPopover
          position={popover.position}
          onSave={handleSave}
          onCancel={() => setPopover(null)}
        />
      )}
      {popover?.mode === "edit" && (
        <CellConfigPopover
          position={{ row: popover.cell.row, col: popover.cell.col }}
          cell={popover.cell}
          onSave={handleSave}
          onCancel={() => setPopover(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run frontend tests**

```bash
npm run test --workspace frontend
```

Expected: all existing tests still pass.

- [ ] **Step 3: Manually verify end-to-end in dev**

Start both dev servers (backend on 3000, frontend on 5173). In the browser:

1. Click "Edit" in the ribbon — cells gain dashed outlines.
2. Double-click an empty grid position — popover opens.
3. Fill in Title="GitHub", Japanese subtitle="コード", Icon="🐙", External URL="https://github.com". Click Save.
4. Popover closes, cell appears on the grid.
5. Double-click the new cell — popover opens with the values pre-filled.
6. Click Delete — cell disappears.
7. Exit Edit mode. Create a cell again, click it once (not double) — expanded card appears. Click Open — new tab opens github.com.

Kill dev servers.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/spreadsheet/SpreadsheetPage.tsx
git commit -m "feat(frontend): wire popover for create, edit, delete in edit mode"
```

---

## Task 26: Add drag-to-move in edit mode (HTML5 drag and drop)

**Files:**
- Modify: `frontend/src/spreadsheet/Cell.tsx`
- Modify: `frontend/src/spreadsheet/Grid.tsx`
- Modify: `frontend/src/spreadsheet/SpreadsheetPage.tsx`

- [ ] **Step 1: Update `Cell.tsx` to be draggable in edit mode**

Replace the component to add drag handlers. Update the file to:

```typescript
import type { Cell as CellData, CellType } from "@cellsite/shared";
import { useEditMode } from "./useEditMode.js";

interface CellProps {
  cell: CellData;
  onClick: (cell: CellData) => void;
  onHover: (cell: CellData | null) => void;
  onDoubleClick?: (cell: CellData) => void;
  onDragStart?: (cell: CellData) => void;
  onDragEnd?: () => void;
}

const ACCENT_CLASS: Record<CellType, string> = {
  blog: "text-accent-blog",
  gallery: "text-accent-gallery",
  audio: "text-accent-audio",
  document: "text-accent-document",
  presentation: "text-accent-presentation",
  external: "text-accent-external",
};

const GRADIENT_CLASS: Record<CellType, string> = {
  blog: "bg-gradient-to-br from-[rgb(var(--color-accent-blog)/0.08)] to-transparent",
  gallery: "bg-gradient-to-br from-[rgb(var(--color-accent-gallery)/0.08)] to-transparent",
  audio: "bg-gradient-to-br from-[rgb(var(--color-accent-audio)/0.08)] to-transparent",
  document: "bg-gradient-to-br from-[rgb(var(--color-accent-document)/0.08)] to-transparent",
  presentation: "bg-gradient-to-br from-[rgb(var(--color-accent-presentation)/0.08)] to-transparent",
  external: "bg-gradient-to-br from-[rgb(var(--color-accent-external)/0.08)] to-transparent",
};

export function Cell({
  cell,
  onClick,
  onHover,
  onDoubleClick,
  onDragStart,
  onDragEnd,
}: CellProps) {
  const editMode = useEditMode();

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={editMode.enabled}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", cell.id);
        onDragStart?.(cell);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onClick(cell)}
      onDoubleClick={() => onDoubleClick?.(cell)}
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick(cell);
      }}
      className={`
        border-r border-b border-border cursor-pointer
        flex flex-col items-center justify-center text-center
        px-2 py-3 min-h-[90px]
        ${GRADIENT_CLASS[cell.type]}
        ${editMode.enabled ? "outline-dashed outline-1 outline-accent/50 cursor-move" : ""}
        hover:brightness-110 transition-all
      `}
      style={{
        gridColumn: `span ${cell.colSpan}`,
        gridRow: `span ${cell.rowSpan}`,
      }}
      data-cell-id={cell.id}
    >
      <div className="text-xl mb-1 opacity-90">{cell.icon}</div>
      <div className={`font-medium ${ACCENT_CLASS[cell.type]}`}>{cell.title}</div>
      {cell.subtitleJa && (
        <div className="text-[10px] text-text-muted mt-0.5 font-jp">
          {cell.subtitleJa}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `Grid.tsx` to accept drag callbacks and pass them through**

Add these props to `GridProps` and thread them down:

```typescript
import type { Cell as CellData } from "@cellsite/shared";
import { Cell } from "./Cell.js";
import { colLetter } from "./cellRef.js";
import { useEditMode } from "./useEditMode.js";

interface GridProps {
  cells: CellData[];
  cols: number;
  rows: number;
  onCellClick: (cell: CellData) => void;
  onCellDoubleClick?: (cell: CellData) => void;
  onCellHover: (cell: CellData | null, pos: { row: number; col: number } | null) => void;
  onEmptyDoubleClick: (row: number, col: number) => void;
  onCellDragStart?: (cell: CellData) => void;
  onCellDragEnd?: () => void;
  onCellDropOnPosition?: (row: number, col: number) => void;
}

export function Grid({
  cells,
  cols,
  rows,
  onCellClick,
  onCellDoubleClick,
  onCellHover,
  onEmptyDoubleClick,
  onCellDragStart,
  onCellDragEnd,
  onCellDropOnPosition,
}: GridProps) {
  const editMode = useEditMode();

  const occupied = new Map<string, CellData>();
  const topLeft = new Map<string, CellData>();
  for (const cell of cells) {
    topLeft.set(`${cell.row},${cell.col}`, cell);
    for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
      for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
        occupied.set(`${r},${c}`, cell);
      }
    }
  }

  const gridTemplateColumns = `32px repeat(${cols}, minmax(120px, 1fr))`;

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="grid"
        style={{ gridTemplateColumns, gridAutoRows: "minmax(90px, auto)" }}
      >
        <div className="bg-surface border-r border-b border-border sticky top-0 left-0 z-20 h-7" />
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={`col-${c}`}
            className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky top-0 z-10 h-7 flex items-center justify-center"
          >
            {colLetter(c)}
          </div>
        ))}

        {Array.from({ length: rows }, (_, r) => {
          const elements: JSX.Element[] = [];
          elements.push(
            <div
              key={`rownum-${r}`}
              className="bg-surface border-r border-b border-border text-text-muted text-xs text-center sticky left-0 z-10 flex items-center justify-center"
            >
              {r + 1}
            </div>,
          );

          for (let c = 0; c < cols; c++) {
            const key = `${r},${c}`;
            const occ = occupied.get(key);
            if (occ && topLeft.get(key) === occ) {
              elements.push(
                <Cell
                  key={`cell-${occ.id}`}
                  cell={occ}
                  onClick={onCellClick}
                  onDoubleClick={onCellDoubleClick}
                  onDragStart={onCellDragStart}
                  onDragEnd={onCellDragEnd}
                  onHover={(cell) =>
                    onCellHover(cell, cell ? { row: cell.row, col: cell.col } : null)
                  }
                />,
              );
            } else if (!occ) {
              elements.push(
                <div
                  key={`empty-${r}-${c}`}
                  className={`
                    border-r border-b border-border bg-muted min-h-[90px]
                    ${editMode.enabled ? "outline-dashed outline-1 outline-border cursor-cell" : ""}
                  `}
                  onMouseEnter={() => onCellHover(null, { row: r, col: c })}
                  onMouseLeave={() => onCellHover(null, null)}
                  onDoubleClick={() => editMode.enabled && onEmptyDoubleClick(r, c)}
                  onDragOver={(e) => {
                    if (editMode.enabled) e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (editMode.enabled) onCellDropOnPosition?.(r, c);
                  }}
                  data-row={r}
                  data-col={c}
                />,
              );
            }
          }
          return <div key={`row-${r}`} style={{ display: "contents" }}>{elements}</div>;
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `SpreadsheetPage.tsx` to handle drag state and drop**

Add a drag ref and drop handler. Replace the file:

```typescript
import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { cellsApi } from "../lib/cells.js";
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
} from "@cellsite/shared";
import type { Cell, CellCreateInput } from "@cellsite/shared";
import { Ribbon } from "./Ribbon.js";
import { FormulaBar } from "./FormulaBar.js";
import { SheetTabs } from "./SheetTabs.js";
import { Grid } from "./Grid.js";
import { ExpandedCell } from "./ExpandedCell.js";
import { CellConfigPopover } from "../editors/CellConfigPopover.js";
import { useHoveredCell } from "./useHoveredCell.js";
import { useEditMode } from "./useEditMode.js";

type PopoverState =
  | { mode: "create"; position: { row: number; col: number } }
  | { mode: "edit"; cell: Cell }
  | null;

function canDropAt(
  cells: Cell[],
  dragged: Cell,
  targetRow: number,
  targetCol: number,
): boolean {
  // All positions the dragged cell would occupy at the target
  for (let r = targetRow; r < targetRow + dragged.rowSpan; r++) {
    for (let c = targetCol; c < targetCol + dragged.colSpan; c++) {
      for (const other of cells) {
        if (other.id === dragged.id) continue;
        const otherEndRow = other.row + other.rowSpan - 1;
        const otherEndCol = other.col + other.colSpan - 1;
        if (
          r >= other.row &&
          r <= otherEndRow &&
          c >= other.col &&
          c <= otherEndCol
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

export function SpreadsheetPage() {
  const [expanded, setExpanded] = useState<Cell | null>(null);
  const [popover, setPopover] = useState<PopoverState>(null);
  const draggedCell = useRef<Cell | null>(null);
  const { setHoveredCell, setHoveredPosition } = useHoveredCell();
  const editMode = useEditMode();
  const queryClient = useQueryClient();

  const { data: cells = [], isLoading } = useQuery({
    queryKey: ["cells", "creative"],
    queryFn: () => cellsApi.list("creative"),
  });

  const createMutation = useMutation({
    mutationFn: (input: CellCreateInput) => cellsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CellCreateInput }) =>
      cellsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cellsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
      setPopover(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, row, col }: { id: string; row: number; col: number }) =>
      cellsApi.update(id, { row, col }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cells", "creative"] });
    },
  });

  const handleCellClick = (cell: Cell) => {
    if (editMode.enabled) return;
    setExpanded(cell);
  };

  const handleCellDoubleClick = (cell: Cell) => {
    if (!editMode.enabled) return;
    setPopover({ mode: "edit", cell });
  };

  const handleEmptyDoubleClick = (row: number, col: number) => {
    if (!editMode.enabled) return;
    setPopover({ mode: "create", position: { row, col } });
  };

  const handleCellHover = (
    cell: Cell | null,
    pos: { row: number; col: number } | null,
  ) => {
    setHoveredCell(cell);
    setHoveredPosition(pos);
  };

  const handleOpen = (cell: Cell) => {
    if (cell.type === "external" && cell.externalUrl) {
      window.open(cell.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleSave = (input: CellCreateInput) => {
    if (popover?.mode === "edit") {
      updateMutation.mutate({ id: popover.cell.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  const handleDelete = () => {
    if (popover?.mode === "edit") {
      deleteMutation.mutate(popover.cell.id);
    }
  };

  const handleDragStart = (cell: Cell) => {
    draggedCell.current = cell;
  };

  const handleDragEnd = () => {
    draggedCell.current = null;
  };

  const handleDropOnPosition = (row: number, col: number) => {
    const dragged = draggedCell.current;
    if (!dragged) return;
    if (!canDropAt(cells, dragged, row, col)) return;
    moveMutation.mutate({ id: dragged.id, row, col });
    draggedCell.current = null;
  };

  return (
    <div className="flex flex-col h-screen bg-base text-text">
      <Ribbon />
      <FormulaBar />
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          Loading grid…
        </div>
      ) : (
        <Grid
          cells={cells}
          cols={DEFAULT_GRID_COLS}
          rows={DEFAULT_GRID_ROWS}
          onCellClick={handleCellClick}
          onCellDoubleClick={handleCellDoubleClick}
          onCellHover={handleCellHover}
          onEmptyDoubleClick={handleEmptyDoubleClick}
          onCellDragStart={handleDragStart}
          onCellDragEnd={handleDragEnd}
          onCellDropOnPosition={handleDropOnPosition}
        />
      )}
      <SheetTabs />
      {expanded && (
        <ExpandedCell
          cell={expanded}
          onClose={() => setExpanded(null)}
          onOpen={handleOpen}
        />
      )}
      {popover?.mode === "create" && (
        <CellConfigPopover
          position={popover.position}
          onSave={handleSave}
          onCancel={() => setPopover(null)}
        />
      )}
      {popover?.mode === "edit" && (
        <CellConfigPopover
          position={{ row: popover.cell.row, col: popover.cell.col }}
          cell={popover.cell}
          onSave={handleSave}
          onCancel={() => setPopover(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run all tests**

```bash
npm run test --workspace frontend
npm run test --workspace backend
```

Expected: all pass.

- [ ] **Step 5: Manually verify drag in dev servers**

Start both dev servers. Enter edit mode, drag a cell to an empty position. Expected: cell moves, persists after refresh.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/spreadsheet/Cell.tsx frontend/src/spreadsheet/Grid.tsx frontend/src/spreadsheet/SpreadsheetPage.tsx
git commit -m "feat(frontend): add drag-to-move cells in edit mode with span-aware drop validation"
```

---

## Task 27: Add mobile pan support to the grid

**Files:**
- Modify: `frontend/src/spreadsheet/Grid.tsx`
- Modify: `frontend/index.html`

- [ ] **Step 1: Update viewport meta to allow pinch-zoom**

In `frontend/index.html`, replace the viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
```

- [ ] **Step 2: Update `Grid.tsx` outer wrapper for mobile pan**

Change the outermost div classes in Grid.tsx from `flex-1 overflow-auto` to `flex-1 overflow-auto touch-pan-x touch-pan-y -webkit-overflow-scrolling-touch`.

Specifically, edit the first `<div>` inside the return statement:

```typescript
return (
  <div className="flex-1 overflow-auto" style={{ WebkitOverflowScrolling: "touch" }}>
```

- [ ] **Step 3: Test in browser dev tools mobile emulation**

Start dev servers. Open Chrome DevTools, toggle device toolbar (mobile emulation). Expected: grid can be scrolled horizontally and vertically by drag/swipe.

- [ ] **Step 4: Commit**

```bash
git add frontend/index.html frontend/src/spreadsheet/Grid.tsx
git commit -m "feat(frontend): enable mobile pan and pinch-zoom on spreadsheet grid"
```

---

## Task 28: Backend — build script produces deployable artifact

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/tsconfig.json`

- [ ] **Step 1: Confirm `backend/tsconfig.json` emits to `dist/`**

Already configured in Task 3. Verify by running:

```bash
npm run build --workspace backend
```

Expected: `backend/dist/server.js`, `backend/dist/routes/cells.js`, etc. appear.

- [ ] **Step 2: Verify the built server can start (assuming DB is reachable)**

```bash
cd backend
NODE_ENV=production node dist/server.js
```

Expected: "Server listening on port 3000" (or whatever `.env` specifies). Ctrl+C to stop.

- [ ] **Step 3: Update root `package.json` `build` script to include migrations**

Update root `package.json`:

```json
{
  "name": "cellsite",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "workspaces": [
    "shared",
    "backend",
    "frontend",
    "e2e"
  ],
  "scripts": {
    "dev": "npm run dev --workspaces --if-present",
    "build": "npm run build --workspace shared && npm run build --workspace frontend && npm run build --workspace backend",
    "start": "npm run db:migrate --workspace backend && npm run start --workspace backend",
    "test": "npm run test --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "build: run migrations as part of npm start for deployment"
```

---

## Task 29: Add production static-serving integration test

**Files:**
- Modify: `backend/src/server.test.ts`

- [ ] **Step 1: Add a test that verifies the static handler works when dist exists**

Append to `backend/src/server.test.ts`:

```typescript
describe("server static handling", () => {
  it("returns 404 JSON for unknown /api/* routes", async () => {
    const app = await buildServer();
    try {
      const response = await app.inject({
        method: "GET",
        url: "/api/nonexistent",
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm run test --workspace backend
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.test.ts
git commit -m "test(backend): verify unknown /api routes return 404"
```

---

## Task 30: Add the Playwright E2E smoke test

**Files:**
- Create: `e2e/package.json`
- Create: `e2e/playwright.config.ts`
- Create: `e2e/spreadsheet.spec.ts`

- [ ] **Step 1: Create `e2e/package.json`**

```json
{
  "name": "@cellsite/e2e",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "install-browsers": "playwright install chromium"
  },
  "devDependencies": {
    "@playwright/test": "^1.46.0"
  }
}
```

- [ ] **Step 2: Install and install browser**

```bash
npm install
npm run install-browsers --workspace e2e
```

- [ ] **Step 3: Create `e2e/playwright.config.ts`**

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev --workspace backend",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: "npm run dev --workspace frontend",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
  projects: [
    { name: "chromium", use: { channel: "chromium" } },
  ],
});
```

- [ ] **Step 4: Create `e2e/spreadsheet.spec.ts`**

```typescript
import { test, expect } from "@playwright/test";

test.describe("cellsite spreadsheet", () => {
  test.beforeEach(async ({ request }) => {
    // Clean up any leftover cells via API
    const cells = await request.get("http://localhost:3000/api/cells");
    const body = await cells.json();
    for (const cell of body) {
      await request.delete(`http://localhost:3000/api/cells/${cell.id}`);
    }
  });

  test("renders the ribbon, grid headers, and sheet tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("セルサイト")).toBeVisible();
    await expect(page.getByText("A")).toBeVisible();
    await expect(page.getByText("J")).toBeVisible();
    await expect(page.getByText("Creative")).toBeVisible();
  });

  test("create, view, and delete a cell via the UI", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Edit" }).click();

    // Double-click the first empty position (A1)
    await page.locator('[data-row="0"][data-col="0"]').dblclick();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Title").fill("GitHub");
    await page.getByLabel("Japanese subtitle").fill("コード");
    await page.getByLabel("External URL").fill("https://github.com");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("GitHub")).toBeVisible();
    await expect(page.getByText("コード")).toBeVisible();

    // Exit edit mode, click to expand
    await page.getByRole("button", { name: "Exit Edit Mode" }).click();
    await page.getByText("GitHub").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("dialog").getByText("https://github.com"),
    ).toBeVisible();

    // Close expanded
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Re-enter edit mode and delete the cell
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByText("GitHub").dblclick();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("GitHub")).not.toBeVisible();
  });
});
```

- [ ] **Step 5: Run the E2E test**

Ensure backend `.env` points at the real ghost.build DB (or a test DB — running destructive deletes against it). Prefer a dedicated test DB for safety.

```bash
npm run test --workspace e2e
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add e2e/
git commit -m "test(e2e): add playwright smoke test for spreadsheet create/view/delete flow"
```

---

## Task 31: Write deployment README and deploy configuration hints

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with comprehensive instructions**

```markdown
# Cellsite

A portfolio website whose home surface is a spreadsheet. Built with Vite + React + TypeScript (frontend), Fastify (backend), Drizzle ORM + Postgres via ghost.build (database).

**Phase A (current):** Foundation and spreadsheet shell. External link cells work end-to-end. Richer content types (Blog, Gallery, Documents, Presentations, Audio) arrive in later phases.

## Prerequisites

- Node.js 22+
- A Postgres database. Provision one on ghost.build:
  ```bash
  ghost create cellsite
  ```
  Copy the connection string into `.env` as `DATABASE_URL`.

## Local Development

```bash
cp .env.example backend/.env
# edit backend/.env and set DATABASE_URL to your ghost.build connection string
npm install
npm run build --workspace shared
npm run db:migrate --workspace backend
npm run dev --workspace backend   # terminal 1: API on :3000
npm run dev --workspace frontend  # terminal 2: UI on :5173
```

Visit http://localhost:5173.

## Tests

```bash
npm run test               # all workspaces
npm run test --workspace backend
npm run test --workspace frontend
npm run test --workspace e2e    # requires both dev servers running
```

## Production Build

```bash
npm run build
npm start
```

The `start` script runs pending migrations then boots Fastify, which serves both the API and the built frontend on `PORT` (default 3000).

## Deployment (Railway)

1. Push this repo to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Add environment variables:
   - `DATABASE_URL` = ghost.build connection string
   - `NODE_ENV` = `production`
   - `UPLOAD_DIR` = `/app/uploads`
4. Railway auto-detects Node.js. Set:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
5. Add a persistent volume at `/app/uploads` (Railway dashboard → Volumes).
6. Deploy.

## Deployment (dailey.cloud)

Same approach: connect the GitHub repo, set the same env vars, build command `npm install && npm run build`, start command `npm start`. Mount a volume at `/app/uploads`.

## Project Structure

```
cellsite/
├── shared/     # Types shared between FE and BE
├── backend/    # Fastify + Drizzle + Postgres
├── frontend/   # Vite + React + Tailwind
└── e2e/        # Playwright smoke test
```

## Spec & Plan

- Spec: `docs/superpowers/specs/2026-04-10-cellsite-design.md`
- Plan: `docs/superpowers/plans/2026-04-10-cellsite-phase-a-foundation.md`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add deployment and development instructions"
```

---

## Task 32: Final build verification and push

**Files:** none (verification step)

- [ ] **Step 1: Run all tests and builds from a clean state**

```bash
rm -rf node_modules shared/dist backend/dist frontend/dist
npm install
npm run build
npm run test
```

Expected: all builds succeed, all tests pass.

- [ ] **Step 2: Verify production server runs with built artifacts**

```bash
NODE_ENV=production PORT=3001 npm start
```

Visit http://localhost:3001. Expected: spreadsheet loads correctly (served by Fastify, not Vite dev server). Ctrl+C.

- [ ] **Step 3: Push to GitHub**

Create a GitHub repository (user action):

```bash
git remote add origin <github-repo-url>
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Deploy via Railway or dailey.cloud**

Follow the README deployment instructions. Verify:
- The deployed site loads at the platform-provided URL
- Creating a cell via edit mode persists across a browser refresh
- Uploaded/created cells survive a redeploy (volume works — relevant for later phases)

---

## Self-Review

**Spec coverage check:**

| Spec section | Covered by |
|---|---|
| Spreadsheet home (ribbon, formula bar, grid, sheet tabs, col/row headers) | Tasks 17, 18, 19, 21, 22 |
| Dark/light mode auto via prefers-color-scheme | Tasks 12, 13 |
| Japanese art aesthetic (tokens, katakana branding, subtitles) | Tasks 12, 17, 24 |
| Default grid 10×20 | Task 22 (uses DEFAULT_GRID_COLS/ROWS) |
| Hover updates formula bar | Tasks 18, 22 |
| Click expands cell in overlay | Task 23 |
| Click "Open" opens external URL | Task 23 |
| Escape closes expanded cell | Task 23 |
| Edit mode toggle in ribbon | Task 17 |
| Dashed outline on cells in edit mode | Tasks 20, 26 |
| Double-click empty → create popover | Tasks 24, 25 |
| Double-click configured → edit popover | Tasks 24, 25 |
| Popover fields (type, title, subtitle_ja, target, icon, spans, delete) | Task 24 |
| Drag cells, reject overlapping drops with spans | Task 26 |
| Preset icon picker, no upload | Task 24 |
| Single cell per (sheet,row,col) unique | Task 6 |
| Cells API CRUD + reorder | Tasks 7, 8 |
| CORS for dev | Task 9 |
| Serve frontend from Fastify in prod | Task 10 |
| Mobile pan grid | Task 27 |
| External Link content type | Tasks 23, 24, 25 |
| Deploy to Railway / dailey.cloud | Tasks 28, 31, 32 |
| No Docker | Confirmed throughout |
| Empty cells not in DB | Tasks 6, 21 (occupied map) |
| Ghost.build Postgres + drizzle migrations | Tasks 5, 6 |
| CellConfigPopover component | Tasks 24, 25 |
| ThemeProvider | Task 13 |
| Vitest + RTL + Playwright testing strategy | Tasks 4, 7, 13, 15, 17, 18, 20, 21, 24, 29, 30 |

Content types deferred from this phase (Blog, Gallery, Document, Presentation, Audio) are out of scope for Plan A by design — they will each get their own plan.

**Placeholder scan:** No TBDs, TODOs, or "implement later" entries. Every code step contains the full code. Every command step shows the exact command and expected output.

**Type consistency check:**
- `Cell` type from `@cellsite/shared` is used consistently across frontend and backend.
- `CellCreateInput` / `CellUpdateInput` match the Drizzle insert/update shapes through the Zod validators in `routes/cells.ts`.
- `colLetter` and `cellRef` are defined in `cellRef.ts` and used by `FormulaBar.tsx` and `Grid.tsx` with matching signatures.
- `useEditMode` store uses `.enabled`, `.toggle`, `.set` consistently across tests and consumers.
- `useHoveredCell` store uses `hovered`, `hoveredPosition`, `setHoveredCell`, `setHoveredPosition` consistently.
- `DEFAULT_SHEET`, `DEFAULT_GRID_COLS`, `DEFAULT_GRID_ROWS`, `CELL_TYPES` are exported from shared and imported where needed.
- Grid drag props (`onCellDragStart`, `onCellDragEnd`, `onCellDropOnPosition`) are consistent between `Grid.tsx`, `Cell.tsx`, and `SpreadsheetPage.tsx`.

Plan is ready for execution.
