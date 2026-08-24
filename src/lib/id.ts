/**
 * Safe unique ID generator compatible across all browsers, webviews, and non-secure iframe contexts.
 */
export function generateSafeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback for restricted contexts
  }
  return 'alarm-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}
