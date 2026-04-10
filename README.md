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
