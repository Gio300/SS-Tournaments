# smL Tournament Rules Hub

Official website for **smL tournament rules**: single source of truth, rules index, FAQ, rules bot, and community board.

## Tech stack

- **Next.js 14** (App Router), **Tailwind CSS**, **Lucide React**
- **Fonts:** Inter, Orbitron (headers)
- **Community:** Supabase (anonymous display name in localStorage)
- **Deploy:** Static export → GitHub Pages or Vercel

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment (optional)

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` if you use the **Community Board**.

To enable the board:

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the script in `supabase/schema.sql`.
3. Add the project URL and anon key to `.env.local`.

Without Supabase, the rest of the site (Rules, FAQ, Rules Bot) works; the Community page will show a loading error for the feed.

## Build (static export)

```bash
npm run build
```

Output is in the `out/` folder. Serve it with any static host.

### Deploy to GitHub Pages (recommended: GitHub Actions)

1. Create a repo on GitHub (e.g. `SS-Tournaments`) and push this project to `main`.

2. In the repo: **Settings → Pages → Build and deployment**: set Source to **GitHub Actions**.

3. On the next push to `main`, the workflow (`.github/workflows/deploy-pages.yml`) will build and deploy. The site will be at:
   `https://YOUR_USERNAME.github.io/SS-Tournaments/`

The workflow sets `GITHUB_REPO` to the repo name so base path works for project sites.

### Deploy to GitHub Pages (manual, e.g. from Git Bash)

1. Build with base path (use your repo name):
   **Git Bash:**
   ```bash
   export GITHUB_REPO=SS-Tournaments
   npm run build
   ```
   **PowerShell:** `$env:GITHUB_REPO="SS-Tournaments"; npm run build`

2. Push the contents of `out/` to the `gh-pages` branch:
   ```bash
   cd out
   git init
   git add -A
   git commit -m "Deploy"
   git branch -M gh-pages
   git remote add origin https://github.com/YOUR_USERNAME/SS-Tournaments.git
   git push -u origin gh-pages --force
   ```
   Then in **Settings → Pages**, choose branch `gh-pages` and root.

### Deploy to Vercel

- Connect the repo to Vercel; no `output: 'export'` needed if you prefer server mode, or keep export and use “Static Export” as needed.
- Add env vars (e.g. Supabase) in the Vercel dashboard.

## Updating rules

- **Single source of truth:** `src/data/rules.ts`
- Edit `RULES_SECTIONS`, `FAQ_ENTRIES`, and `RULES_UPDATE_DATE`.
- Rebuild and redeploy. Rules Bot and Rules page both use this file.

## Moderation (Community Board)

- **Delete/lock:** Use Supabase Dashboard → Table Editor → `community_posts` (delete row or set `locked = true`).
- No delete button in the UI; moderation is done via Dashboard or staff tools.

---

Updated 02/01/26 – smL Tournament Rules
