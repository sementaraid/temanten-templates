const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL
const BASE = CDN_BASE + '/templates/jogja-1/v1.0.0';

export const assetUrl = (path: string): string => `${BASE}${path}`