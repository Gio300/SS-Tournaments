/**
 * VidBridge extension install URL.
 * When the extension is verified in Chrome Web Store, set NEXT_PUBLIC_VIDBRIDGE_CHROME_STORE_URL
 * (e.g. https://chrome.google.com/webstore/detail/vidbridge/xxx) to prompt users to install from the store.
 * Otherwise uses the zip download page.
 */
import { basePath } from './basePath';

export function getVidBridgeInstallUrl(): string {
  const storeUrl = process.env.NEXT_PUBLIC_VIDBRIDGE_CHROME_STORE_URL;
  if (storeUrl && storeUrl.trim()) {
    return storeUrl.trim();
  }
  const pathPrefix = basePath ? `${basePath}/` : '/';
  return `${pathPrefix}extension/install/`;
}
