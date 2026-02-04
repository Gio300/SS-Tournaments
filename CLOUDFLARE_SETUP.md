# Cloudflare Worker Setup Guide

## Quick Start

1. **Create Cloudflare Account** (if needed)
   - Go to https://dash.cloudflare.com/sign-up
   - Free tier includes Workers AI

2. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

3. **Login**
   ```bash
   wrangler login
   ```

4. **Deploy Worker**
   ```bash
   cd cloudflare-worker
   npm install
   wrangler deploy
   ```

5. **Copy Worker URL**
   - After deployment, you'll see: `https://sml-rules-bot.YOUR-SUBDOMAIN.workers.dev`
   - Copy this URL

6. **Add to Next.js**
   - Local: Add to `.env.local`: `NEXT_PUBLIC_CF_WORKER_URL=https://your-worker-url`
   - GitHub Pages: Add as secret in **Settings → Secrets and variables → Actions** → `NEXT_PUBLIC_CF_WORKER_URL`

7. **Rebuild and Deploy**
   - The Rules Bot will automatically use AI when the URL is set
   - Falls back to keyword matching if not configured

## Model Used

- **Llama 3.1 8B Instruct** (`@cf/meta/llama-3.1-8b-instruct`)
- Free tier: 10,000 requests/day
- Optimized for factual, rule-based answers

## Troubleshooting

- **"AI binding not found"**: Enable Workers AI in Cloudflare dashboard
- **CORS errors**: Worker includes CORS headers; check URL is correct
- **Rate limits**: Free tier is generous; if exceeded, bot falls back to keyword matching
