// Affiliate attribution: a visitor arriving via ?ref=CODE is remembered for
// 30 days, and the most recent link wins. The remembered code is sent with
// checkout; the backend ignores it if the code has since been deactivated.

const STORAGE_KEY = 'affiliateRef';
const CLICKED_KEY = 'affiliateRefClicked';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeAffiliateCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getStoredAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, savedAt } = JSON.parse(raw);
    if (!code || Date.now() - savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return code;
  } catch {
    return null;
  }
}

export function storeAffiliateCode(code: string) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ code: normalizeAffiliateCode(code), savedAt: Date.now() }),
    );
  } catch {
    // Storage unavailable (e.g. private mode) — attribution just won't persist.
  }
}

export function clearStoredAffiliateCode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// Clicks are counted once per browser session per code, so refreshing or
// re-opening the link in the same session doesn't inflate the numbers.
export function shouldCountClick(code: string): boolean {
  try {
    const clicked: string[] = JSON.parse(sessionStorage.getItem(CLICKED_KEY) || '[]');
    if (clicked.includes(code)) return false;
    sessionStorage.setItem(CLICKED_KEY, JSON.stringify([...clicked, code]));
    return true;
  } catch {
    return true;
  }
}
