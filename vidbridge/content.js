/**
 * VidBridge - Content script
 * Listens for cookie requests and ping from the Create Highlight page.
 */

document.addEventListener('buttonmasherz:request-extension-ping', () => {
  document.dispatchEvent(new CustomEvent('buttonmasherz:extension-ready'));
});

document.addEventListener('buttonmasherz:request-yt-cookies', () => {
  chrome.runtime.sendMessage({ type: 'getYoutubeCookies' }, (response) => {
    if (chrome.runtime.lastError) {
      document.dispatchEvent(new CustomEvent('buttonmasherz:yt-cookies-error', {
        detail: { error: chrome.runtime.lastError.message }
      }));
      return;
    }
    if (response?.error) {
      document.dispatchEvent(new CustomEvent('buttonmasherz:yt-cookies-error', {
        detail: { error: response.error }
      }));
      return;
    }
    document.dispatchEvent(new CustomEvent('buttonmasherz:yt-cookies', {
      detail: { cookies: response?.cookies || '' }
    }));
  });
});
