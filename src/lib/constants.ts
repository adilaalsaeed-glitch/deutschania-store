// Shared between server-only code (src/lib/analytics.ts) and client components
// (ProductCard's scarcity badge) - keep this file free of any server-only imports (db, etc.)
// so it stays safe to bundle into the browser.
export const LOW_STOCK_THRESHOLD = 5;
