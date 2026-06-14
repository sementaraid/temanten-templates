const CDN_BASE = import.meta.env.PROD ? import.meta.env.VITE_CDN_BASE_URL : '';

console.log('CDN_BASE:', CDN_BASE);
export const assetUrl = (path: string): string => `${CDN_BASE}${path}`;
