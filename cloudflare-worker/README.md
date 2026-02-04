# Cloudflare Worker for smL Rules Bot

This Cloudflare Worker uses Workers AI (Llama 3.1 8B Instruct) to power the Rules Bot with better understanding of questions, partial words, and game terminology.

## Features

- Uses **Llama 3.1 8B Instruct** model (free tier)
- Understands partial words (e.g., "koto" → "Kotoamatsukami")
- Handles synonyms and game terminology
- Returns natural language answers citing specific rules
- CORS enabled for client-side calls

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy:**
   ```bash
   wrangler deploy
   ```

4. **Copy the worker URL** and add it to your Next.js app's environment variables as `NEXT_PUBLIC_CF_WORKER_URL`.

## Configuration

The worker accepts POST requests with:
```json
{
  "question": "User's question about rules",
  "rulesContext": "Formatted rules text from rulesContext.ts"
}
```

Returns:
```json
{
  "answer": "AI-generated answer",
  "model": "llama-3.1-8b-instruct"
}
```

## Free Tier Limits

Cloudflare Workers AI free tier includes:
- 10,000 requests per day
- Sufficient for most tournament rule queries

## Troubleshooting

- **CORS errors:** The worker includes CORS headers; ensure your Next.js app is calling the correct URL.
- **AI binding not found:** Make sure Workers AI is enabled in your Cloudflare account (free tier available).
- **Rate limits:** If you exceed free tier limits, the Next.js app will fall back to keyword matching.
