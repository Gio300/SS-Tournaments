# Deploy to GitHub and turn on the website

## 1. Create the repo on GitHub

1. Open https://github.com/new
2. Repository name: `SS-Tournaments` (or any name)
3. Public, no README (you already have one)
4. Create repository

## 2. Push this project (Git Bash or CMD)

**Option A – Git Bash**

```bash
cd "/c/Users/Flying Phoenix PCs/Desktop/AiKloudy/SS Tournaments"
git remote add origin https://github.com/YOUR_USERNAME/SS-Tournaments.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `SS-Tournaments` with your GitHub username and repo name.

**Option B – Batch file (CMD)**

```cmd
push-to-github.bat https://github.com/YOUR_USERNAME/SS-Tournaments.git
```

## 3. Turn on GitHub Pages

1. On the repo: **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not "Deploy from a branch").  
   If you use a branch as the source, the site will show the README instead of the built app.
3. After the first push (or re-run the workflow from the Actions tab), the site deploys.
4. Site URL: `https://YOUR_USERNAME.github.io/SS-Tournaments/`

## 4. Supabase (Community, Clans, Reels, Matches, Live Streams)

1. Create a project at https://supabase.com
2. In the SQL Editor, run in order:
   - `supabase/schema.sql` (community board)
   - `supabase/strikerclips_schema.sql` (profiles, clips, reels, matches, clans, live_streams)
3. Enable Auth: **Authentication → Providers** – enable Email, Google, GitHub as needed

## 5. Cloudflare Worker (Rules Bot + AI Director)

1. Install Wrangler: `npm install -g wrangler`
2. Deploy the worker:
   ```bash
   cd cloudflare-worker
   npm install
   wrangler login
   wrangler deploy
   ```
3. Copy the worker URL (e.g. `https://sml-rules-bot.YOUR-SUBDOMAIN.workers.dev`)
4. One-time: Accept Llama Vision license by sending:
   ```bash
   curl -X POST "YOUR_WORKER_URL/director" -H "Content-Type: application/json" -d '{"action":"agree"}'
   ```

## 6. GitHub Actions Secrets

In the repo: **Settings → Secrets and variables → Actions**, add:

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
- `NEXT_PUBLIC_CF_WORKER_URL` = your Cloudflare Worker URL (e.g. `https://sml-rules-bot.xxx.workers.dev`)

Re-run the **Deploy to GitHub Pages** workflow (Actions tab → Run workflow).

## 7. What You Get

- **Rules Bot** (`/ask`): AI-powered via Cloudflare (Llama 3.1 8B); falls back to keyword matching if no worker URL
- **AI Director** (`/live/director`): Vision model switches between up to 8 live streams
- **Community board** (`/community`), **Clans** (`/boards`), **Reels**, **Matches**, **Live Streams**
