/**
 * ButtonMasherz YouTube Helper - Background script
 * Fetches YouTube cookies and converts to Netscape format for yt-dlp.
 */

function toNetscape(cookies) {
  const lines = ['# Netscape HTTP Cookie File'];
  for (const c of cookies) {
    const domain = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
    const includeSubdomains = c.domain.startsWith('.') ? 'TRUE' : 'FALSE';
    const secure = c.secure ? 'TRUE' : 'FALSE';
    const exp = c.expirationDate ? Math.floor(c.expirationDate) : '0';
    lines.push(`${domain}\t${includeSubdomains}\t${c.path || '/'}\t${secure}\t${exp}\t${c.name}\t${c.value}`);
  }
  return lines.join('\n');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getYoutubeCookies') {
    chrome.cookies.getAll({ url: 'https://www.youtube.com' }, (cookies) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      const netscape = cookies.length > 0 ? toNetscape(cookies) : '';
      sendResponse({ cookies: netscape });
    });
    return true; // async response
  }
});
