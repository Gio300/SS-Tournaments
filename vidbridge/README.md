# VidBridge

Chrome extension that bridges YouTube to ButtonMasherz. Share your YouTube session for clip combining, quick links, and right-click add.

## Install (Development)

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `vidbridge` folder

## Usage

1. Sign in to [youtube.com](https://www.youtube.com) in Chrome
2. Go to ButtonMasherz Create Highlight and add 2–8 YouTube URLs
3. Click Create Highlight – the extension automatically provides your YouTube session
4. Right-click any YouTube link → "Create highlight from this (VidBridge)" to open Create Highlight with the URL pre-filled

## Privacy

- Cookies are read only when you click Create Highlight on the Create Reel page
- Cookies are sent only to the ButtonMasherz combine API for that single request
- Cookies are never stored by the extension or ButtonMasherz
- The extension only runs on `gio300.github.io/SS-Tournaments/reels/create` and `localhost`

## Troubleshooting

- **"Sign in to confirm you're not a bot"** – Make sure you're signed in to YouTube in the same Chrome profile
- **Extension not working** – Reload the extension at `chrome://extensions/` and refresh the Create Highlight page
