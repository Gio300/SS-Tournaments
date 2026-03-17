# Combine Service

Combines 2-8 YouTube clips into one video via yt-dlp + FFmpeg, uploads to Supabase storage, and creates a reel.

## Deploy to Cloud Run

1. Run `gcloud auth login`
2. Set project: `gcloud config set project YOUR_PROJECT_ID`
3. Enable APIs: `gcloud services enable run.googleapis.com`
4. Build and deploy:
   ```bash
   gcloud run deploy combine-service --source . --region us-central1 --allow-unauthenticated
   ```
5. Set env vars in Cloud Run console:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## API

- **POST** `/combine`
- Body: `{ urls: string[], title: string, userId: string }`
- Response: `{ reelId: string, combinedVideoUrl: string }`

## Local test

```bash
cd combine-service
npm install
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node server.js
```
