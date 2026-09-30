'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import {
  normalizeAffiliateCode,
  storeAffiliateCode,
  shouldCountClick,
} from '@/lib/affiliate';

// Picks up ?ref=CODE on any page, remembers it for checkout, counts the
// click, and strips the parameter so a shared or bookmarked URL doesn't
// carry the influencer's code along with it.
export default function AffiliateTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (!ref || !ref.trim()) return;

    const code = normalizeAffiliateCode(ref);
    url.searchParams.delete('ref');
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);

    // Only remember codes the backend recognizes — a mistyped or retired
    // link shouldn't override a valid code from an earlier visit.
    if (shouldCountClick(code)) {
      api
        .trackAffiliateClick(code)
        .then(() => storeAffiliateCode(code))
        .catch(() => {});
    } else {
      storeAffiliateCode(code);
    }
  }, [pathname]);

  return null;
}
