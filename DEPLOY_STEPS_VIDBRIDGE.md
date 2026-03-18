# VidBridge & SS-Tournaments Deployment Steps

## What Was Changed

1. **VidBridge extension**
   - Added ping listener so the site can detect when VidBridge is installed
   - Content script responds to `buttonmasherz:request-extension-ping` with `buttonmasherz:extension-ready`

2. **Create Highlight modal**
   - Detects VidBridge and shows "VidBridge detected" when installed
   - Primary CTA: "Install VidBridge" (or "Get VidBridge from Chrome Web Store" when store URL is set)
   - Manual cookie paste hidden behind small link: "Need to paste cookies manually?"
   - Link to VidBridge privacy policy

3. **Chrome Web Store automation**
   - When `NEXT_PUBLIC_VIDBRIDGE_CHROME_STORE_URL` is set, users are prompted to install from the store
   - Add as GitHub secret when extension is verified

4. **Combine service**
   - Fixed `cookiesEnv` → `cookiesRaw` bug that caused 500 errors when cookies were passed

---

## Steps to Deploy

### 1. VidBridge Extension (Local / Unpacked)

If you use the unpacked extension from `SS-Tournaments/vidbridge`:

1. Open `chrome://extensions/`
2. Find **VidBridge**
3. Click the **refresh** icon on its card

This reloads the extension with the new ping listener.

---

### 2. VidBridge (Chrome Web Store)

If you publish to the Chrome Web Store:

1. Zip is at: `C:\Users\Flying Phoenix PCs\Desktop\vidbridge-chrome-store.zip`
2. In Chrome Web Store Developer Dashboard, upload a new package
3. Submit for review

---

### 3. SS-Tournaments Web App (GitHub Pages)

1. Commit and push to your GitHub repo:
   ```bash
   cd "C:\Users\Flying Phoenix PCs\Desktop\SS-Tournaments"
   git add .
   git status
   git commit -m "VidBridge: extension detection, modal layout, combine-service fix"
   git push origin main
   ```

2. GitHub Actions will build and deploy to GitHub Pages.

3. Or trigger manually: **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

---

### 4. Combine Service (Cloud Run)

Redeploy the combine service so the cookie fix is live:

1. Open a terminal and run:
   ```bash
   cd "C:\Users\Flying Phoenix PCs\Desktop\SS-Tournaments\combine-service"
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gcloud run deploy combine-service --source . --region us-central1 --allow-unauthenticated
   ```

2. Replace `YOUR_PROJECT_ID` with your Google Cloud project ID (e.g. from the Cloud Run URL).

3. If env vars are already set in Cloud Run, they stay. Otherwise set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## When VidBridge is Verified in Chrome Web Store

1. Add GitHub secret: **Settings → Secrets and variables → Actions**
   - Name: `NEXT_PUBLIC_VIDBRIDGE_CHROME_STORE_URL`
   - Value: `https://chrome.google.com/webstore/detail/vidbridge/YOUR_EXTENSION_ID`

2. Re-run the deploy workflow. The modal and install page will then prompt users to install from the Chrome Web Store instead of the zip.

## Fixing the 500 Error (Combine Service)

The 500 error is from the combine-service backend. The cookie bug was fixed in code. **You must redeploy the combine-service to Cloud Run** for the fix to take effect:

```bash
cd "C:\Users\Flying Phoenix PCs\Desktop\SS-Tournaments\combine-service"
gcloud run deploy combine-service --source . --region us-central1 --allow-unauthenticated
```

## Checklist

- [ ] Refresh VidBridge in `chrome://extensions/` (if using unpacked)
- [ ] Commit and push SS-Tournaments to GitHub
- [ ] Redeploy combine-service to Cloud Run (fixes 500 error)
- [ ] (Optional) When extension is verified: add `NEXT_PUBLIC_VIDBRIDGE_CHROME_STORE_URL` secret
