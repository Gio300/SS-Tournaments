/**
 * AI Worker URL - env var or user-configured override in Settings.
 * Use this instead of process.env.NEXT_PUBLIC_CF_WORKER_URL directly
 * so users can configure the URL in Settings when not set at build time.
 */
const STORAGE_KEY = 'buttonmasherz-ai-worker-url';

export function getWorkerUrl(): string | undefined {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_CF_WORKER_URL;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored?.trim()) return stored.trim();
  return process.env.NEXT_PUBLIC_CF_WORKER_URL;
}

export function setWorkerUrl(url: string): void {
  if (url.trim()) localStorage.setItem(STORAGE_KEY, url.trim());
  else localStorage.removeItem(STORAGE_KEY);
}

export function getStoredWorkerUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) ?? '';
}
