# Meta Messenger Integration for SmashHub

To enable "Message on Messenger" for SmashHub friends who follow each other:

## 1. Meta Developer Account

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create or use an existing Meta Developer account
3. Create a new App (or use existing) – type: **Business**

## 2. Add Messenger Product

1. In App Dashboard → Add Product → **Messenger**
2. Configure:
   - **Messenger API**: Enable
   - **Access Token**: Generate for your Page (or use for customer chat)
   - **Webhooks**: For receiving messages (optional for basic linking)

## 3. Facebook Login for Linking

To let users link their Facebook/Messenger to their SmashHub profile:

1. Add **Facebook Login** product
2. Settings → Basic: add App ID, App Secret
3. Facebook Login → Settings:
   - Valid OAuth Redirect URIs: `https://your-domain.com/api/auth/facebook/callback`
   - Client OAuth Login: Yes
   - Web OAuth Login: Yes

## 4. Permissions

Request `pages_messaging` or `email` + `public_profile` for basic linking. For Messenger customer chat plugin, use the Page ID.

## 5. Database

Run migration `007_youtube_facebook_columns.sql` to add `profiles.facebook_id`.

## 6. Planned UI

- **Connect Messenger** in Profile settings: OAuth flow stores `facebook_id` or `messenger_psid`
- **Message** button on friend profiles: opens `https://m.me/{facebook_username}` when both users have linked Facebook

## 7. Group DMs

Messenger doesn't support creating group DMs from a web app without existing conversations. Alternative: "Start group chat" opens Messenger with pre-filled recipient links.
