const CDN_BASE = (import.meta.env.VITE_CDN_BASE_URL as string | undefined) ?? '';

export const assetUrl = (path: string): string => `${CDN_BASE}${path}`;
