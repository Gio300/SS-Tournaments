/** Base path for GitHub Pages (e.g. /SS-Tournaments). Empty for local dev. */
export const basePath =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BASE_PATH) || '';
