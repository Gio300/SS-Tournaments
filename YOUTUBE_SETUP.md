# YouTube API Setup for SmashHub

To enable the YouTube video picker (browse your channel videos and pick clips to add to reels):

## 1. Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **YouTube Data API v3**: APIs & Services → Library → search "YouTube Data API v3" → Enable

## 2. OAuth Credentials

1. APIs & Services → Credentials → Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Authorized JavaScript origins: `https://your-domain.com`, `http://localhost:3000`
4. Authorized redirect URIs: `https://your-domain.com/api/auth/youtube/callback`, `http://localhost:3000/api/auth/youtube/callback`
5. Copy Client ID and Client Secret

## 3. OAuth Scopes

Request these scopes:
- `https://www.googleapis.com/auth/youtube.readonly` – list videos, playlists, channel info

## 4. Quota

Default: 10,000 units/day. Key costs:
- `channels.list`, `videos.list`, `playlists.list`: 1 unit each
- `search.list`: 100 units

Request a quota increase in Cloud Console if needed.

## 5. Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## 6. Current Behavior

Until OAuth is configured, users can:
- Paste YouTube URLs directly on the Create Highlight page
- Save links in Profile and use "Auto-add all saved"
- Add clips one by one with Auto (seconds per clip) or Manual (start/end times)
