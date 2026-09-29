# Content Ops — Saif Rashid

Content creation, posting status, and measurement across Facebook, LinkedIn, and the private
literary-fiction collections (She came, Portraits, হিজলতলা). Ground-zero version: no Facebook
API yet — that's the next step once this is deployed and the PRD's next phase is scoped.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Database**: SQLite locally (zero setup), Postgres in production (Vercel Storage tab
  provisions one directly — no separate account needed). The app switches automatically based
  on whether `DATABASE_URL` is set — see `lib/db.ts`.
- **Design tokens**: colors, type, spacing, components documented in the "Design System — Content
  Ops App" doc from the planning session; implemented in `app/globals.css` and used across
  components.

## Local development

```bash
npm install
npm run seed     # populates data/dev.db with the 44 items already drafted (the same set from
                  # the earlier content tracker: Facebook, LinkedIn, She came, Portraits, হিজলতলা)
npm run dev      # http://localhost:3000
```

No `DATABASE_URL` needed locally — it defaults to SQLite at `data/dev.db` (gitignored, never
committed; re-seed anytime with `npm run seed`).

## Deploying to Vercel

I can't push this to Vercel directly from here — this environment has no network access to
vercel.com and no Vercel credentials. These are the steps to do it yourself; it's the same flow
whether I'm involved or not, since Vercel deploys from a Git repository:

1. **Push this project to a GitHub repo** (create an empty repo on GitHub, then from this
   project folder: `git init && git add -A && git commit -m "Content ops v0" && git remote add
   origin <your-repo-url> && git push -u origin main`).
2. **Import the repo in Vercel** — vercel.com → Add New → Project → select the repo. Framework
   preset (Next.js) is auto-detected; no config changes needed.
3. **Add a Postgres database** — in the new project, go to the Storage tab → Create Database →
   Postgres (this provisions one via Vercel's own integration, no separate account or signup).
   Connecting it auto-adds `DATABASE_URL` (or `POSTGRES_URL` — see note below) to the project's
   environment variables.
4. **Match the env var name** — this app reads `DATABASE_URL`. If Vercel's Postgres integration
   names it `POSTGRES_URL` instead, add a `DATABASE_URL` environment variable in Project
   Settings → Environment Variables with the same connection string value, or rename the read in
   `lib/db.ts` to match — either is a one-line fix.
5. **Deploy** — Vercel builds and deploys automatically on push. The build downloads the Google
   Fonts (Noto Serif Bengali, Source Serif 4, Inter) itself; that step fails only in this
   sandboxed dev environment, not on Vercel's build servers.
6. **Seed the production database once** — from your own machine, with the Vercel Postgres
   connection string exported: `DATABASE_URL="<connection string from Vercel>" npm run seed`.
   This only needs to run once; after that, all edits happen through the app itself.

## What's here vs. what's next

**Here (v0)**: content list per channel, status tracking (Idea / Needs facts / Drafted /
Posted), an editor for title/notes/text per item, a basic analytics view (status breakdown,
posting rate by channel — placeholder until real engagement data exists), a calendar stub.

**Not here yet, pending the next phase of the PRD**: Facebook Graph API connection (actual
posting, real reach/reaction/comment/share numbers replacing the placeholder analytics),
LinkedIn posting, scheduled/queued publishing, authentication (currently open — fine for
single-user local/private use, not for a public deployment without adding it).

## Project structure

```
app/
  content/             list view (filterable by channel) + editor at content/[id]
  analytics/           status breakdown, posting rate
  calendar/             stub, waiting on scheduled publishing
  api/content/          REST-ish API the pages call (GET list, GET/PATCH one item)
components/
  Sidebar.tsx           channel nav
  StatusPill.tsx
lib/
  db.ts                 SQLite/Postgres dual backend
  types.ts              shared types + section/status labels
scripts/
  seed.mjs               seeds from seed-data.json (44 items already drafted)
  seed-data.json
```
