import React from 'react';
import type { CreditLedgerDTO } from '@esparex/contracts';

export const formatReason = (reason?: string): string => {
  if (!reason) return 'Plan Activity';
  const clean = reason.replace(/[0-9a-fA-F]{24}/g, '').replace(/\s+to\s+ad\s*/i, ' ').trim();
  const lower = clean.toLowerCase();
  if (lower.includes('spotlight')) return 'Spotlight Boost';
  if (lower.includes('top_ad') || lower.includes('top ad')) return 'Top Ad Boost';
  if (lower.includes('smart_alert') || lower.includes('smart alert')) return 'Smart Alert';
  if (lower.includes('alert')) return 'Smart Alert';
  if (lower.includes('slot') || lower.includes('post') || lower.includes('ad_posting')) return 'Ad Posting';
  if (lower.includes('pack') || lower.includes('purchase')) return 'Credit Pack Purchased';
  if (lower.includes('plan')) return 'Plan Entitlement';
  if (lower.includes('credit transaction')) return 'Credit Adjustment';
  return clean || 'Plan Activity';
};

export const formatActivityName = (tx: CreditLedgerDTO): string => {
  const isDebit = tx.type === 'DEBIT';
  const absAmount = Math.abs(tx.amount);
  const creditWord = absAmount === 1 ? 'credit' : 'credits';
  const cleanReason = formatReason(tx.reason);

  if (isDebit) {
    if (cleanReason.toLowerCase().includes('spotlight')) return `Spotlight Credit Used — ${absAmount} ${creditWord}`;
    if (cleanReason.toLowerCase().includes('top ad')) return `Top Ad Boost — ${absAmount} ${creditWord}`;
    if (cleanReason.toLowerCase().includes('smart alert')) return `Smart Alert — ${absAmount} ${creditWord}`;
    if (cleanReason.toLowerCase().includes('ad posting') || cleanReason.toLowerCase().includes('slot')) return `Ad Posting — ${absAmount} ${creditWord}`;
    return `${cleanReason} — ${absAmount} ${creditWord}`;
  }
  return `${cleanReason} (+${absAmount} ${creditWord})`;
};

export const formatAppliedDateTime = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const renderSpotlightStatus = (tx: CreditLedgerDTO): React.ReactNode => {
  const isSpotlight =
    tx.entitlementType?.startsWith('SPOTLIGHT') ||
    (tx.reason && tx.reason.toLowerCase().includes('spotlight'));

  if (!isSpotlight && !tx.spotlightStatus) return <span className="text-muted-foreground">—</span>;
  if (tx.spotlightStatus === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
      Spotlight Expired
    </span>
  );
};

export const renderAdStatus = (tx: CreditLedgerDTO): React.ReactNode => {
  if (!tx.adStatus) return <span className="text-muted-foreground">—</span>;
  const isLive = tx.adStatus === 'ACTIVE' || tx.adStatus === 'active' || tx.adStatus === 'live';
  if (isLive) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  }
  if (tx.adStatus === 'EXPIRED' || tx.adStatus === 'expired') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
      {tx.adStatus}
    </span>
  );
};

export const renderTransactionStatus = (tx: CreditLedgerDTO): React.ReactNode => {
  const reasonLower = (tx.reason || '').toLowerCase();
  const isBoost =
    tx.entitlementType?.startsWith('SPOTLIGHT') ||
    tx.entitlementType === 'PUSH_TO_TOP' ||
    reasonLower.includes('spotlight') ||
    reasonLower.includes('top ad') ||
    reasonLower.includes('boost');

  const isSpotlight =
    tx.entitlementType?.startsWith('SPOTLIGHT') ||
    reasonLower.includes('spotlight');

  if (isSpotlight) {
    if (tx.spotlightStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
          Spotlight Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
        Spotlight Expired
      </span>
    );
  }

  if (isBoost) {
    if (tx.spotlightStatus === 'ACTIVE') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
          Boost Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
        Boost Ended
      </span>
    );
  }

  if (tx.adStatus) {
    const isPastExpiry = tx.adExpiresAt ? new Date(tx.adExpiresAt).getTime() <= Date.now() : false;
    const isLive = !isPastExpiry && (tx.adStatus === 'ACTIVE' || tx.adStatus === 'active' || tx.adStatus === 'live');
    if (isLive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
          Ad Live
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
        Ad Expired
      </span>
    );
  }

  return <span className="text-muted-foreground">—</span>;
};

export type LedgerFilterType = 'ALL' | 'MORE_ADS' | 'SPOTLIGHT' | 'TOP_AD' | 'SMART_ALERT';

export const matchesLedgerFilter = (
  type: LedgerFilterType,
  entitlementType?: string,
  reason?: string,
  planName?: string
): boolean => {
  if (type === 'ALL') return true;
  const combined = `${entitlementType || ''} ${reason || ''} ${planName || ''}`.toLowerCase();
  if (type === 'MORE_ADS') return combined.includes('ad_posting') || combined.includes('ad pack') || combined.includes('ad post') || combined.includes('post');
  if (type === 'SPOTLIGHT') return combined.includes('spotlight');
  if (type === 'TOP_AD') return combined.includes('top ad') || combined.includes('push_to_top') || combined.includes('boost');
  if (type === 'SMART_ALERT') return combined.includes('smart_alert') || combined.includes('alert');
  return true;
};

/**
 * Canonical URL builder for listings linked from credit transactions.
 * Resolves to `/ads/${slug}-${id}` (canonical) or `/ads/${id}` to prevent 404 / malformed slug params.
 */
export const getListingDetailHref = (tx: { adSlug?: string; listingId?: string }): string | null => {
  const id = tx.listingId;
  const slug = tx.adSlug;
  if (!id && !slug) return null;
  if (slug && id) {
    if (slug.endsWith(id)) return `/ads/${slug}`;
    return `/ads/${slug}-${id}`;
  }
  return `/ads/${slug || id}`;
};

