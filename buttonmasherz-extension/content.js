/**
 * ButtonMasherz YouTube Helper - Content script
 * Listens for cookie requests from the Create Highlight page and responds with YouTube cookies.
 */

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
