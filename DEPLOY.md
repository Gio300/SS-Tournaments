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

## 4. MCP-style Rules Bot and message board

- **Rules Bot** (`/ask`): Runs entirely in the browser; no extra setup. It uses the rules in the repo.
- **Community board** (`/community`): Needs Supabase:
  1. Create a project at https://supabase.com
  2. Run `supabase/schema.sql` in the SQL Editor
  3. In the repo on GitHub: **Settings → Secrets and variables → Actions**
  4. Add:
     - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
  5. Re-run the **Deploy to GitHub Pages** workflow (Actions tab → Run workflow)

After that, the live site will have the Rules Bot and the community board.
