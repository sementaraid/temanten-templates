const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || '';

console.debug(`CDN_BASE: ${CDN_BASE}`);
export const assetUrl = (path: string): string => `${CDN_BASE}${path}`