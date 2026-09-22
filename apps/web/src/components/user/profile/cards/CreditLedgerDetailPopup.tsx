'use client';

import React from 'react';
import type { CreditLedgerDTO } from '@esparex/contracts';
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  Button,
  ArrowRight,
} from '@esparex/ui';
import {
  formatActivityName,
  formatAppliedDateTime,
  renderTransactionStatus,
  getListingDetailHref,
} from './CreditLedgerFormatters';
import Link from 'next/link';

interface CreditLedgerDetailPopupProps {
  tx: CreditLedgerDTO | null;
  open: boolean;
  onClose: () => void;
}

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-3 py-2 border-b border-border/30 last:border-0">
    <span className="text-tiny font-semibold text-muted-foreground sm:w-28 shrink-0">{label}</span>
    <div className="text-caption text-foreground">{children}</div>
  </div>
);

const formatDate = (iso?: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const CreditLedgerDetailPopup: React.FC<CreditLedgerDetailPopupProps> = ({ tx, open, onClose }) => {
  const [now] = React.useState(() => Date.now());

  if (!tx) return null;

  const isDebit = tx.type === 'DEBIT';
  const absAmount = Math.abs(tx.amount);
  const creditWord = absAmount === 1 ? 'credit' : 'credits';

  const reasonLower = (tx.reason || '').toLowerCase();
  const isSpotlight =
    tx.entitlementType?.startsWith('SPOTLIGHT') ||
    reasonLower.includes('spotlight');
  const isBoost =
    isSpotlight ||
    tx.entitlementType === 'PUSH_TO_TOP' ||
    reasonLower.includes('boost') ||
    reasonLower.includes('top ad') ||
    Boolean(tx.spotlightExpiresAt);

  // 1. Listing posted date (when ad was created)
  const listingPostedDate =
    tx.adPostedAt ||
    (isBoost && tx.adExpiresAt
      ? new Date(new Date(tx.adExpiresAt).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      : (isDebit ? tx.createdAt : undefined));

  // 2. Validity duration string (e.g., "7 days", "1 day", "30 days")
  const validityDisplay = (() => {
    if (tx.validityText && tx.validityText !== 'Expired' && !tx.validityText.includes('left')) {
      return tx.validityText;
    }
    if (tx.spotlightExpiresAt) {
      const spotMs = new Date(tx.spotlightExpiresAt).getTime();
      const txMs = new Date(tx.createdAt).getTime();
      const days = Math.max(1, Math.round((spotMs - txMs) / (1000 * 60 * 60 * 24)));
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (tx.adExpiresAt) {
      const expMs = new Date(tx.adExpiresAt).getTime();
      const startMs = new Date(listingPostedDate || tx.createdAt).getTime();
      const days = Math.max(1, Math.round((expMs - startMs) / (1000 * 60 * 60 * 24)));
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
    return isDebit ? '30 days' : null;
  })();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        variant="centered"
        className="max-w-sm sm:max-w-md p-0 overflow-hidden"
        aria-describedby="ledger-detail-desc"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="text-body-lg font-semibold text-foreground">Activity Details</DialogTitle>
          <p id="ledger-detail-desc" className="text-tiny text-muted-foreground mt-0.5">
            {formatActivityName(tx)}
          </p>
        </DialogHeader>

        <div className="px-5 py-3">
          {/* 1. When the listing was originally posted */}
          {listingPostedDate && (
            <Row label="Listing posted">{formatDate(listingPostedDate)}</Row>
          )}

          {/* 2. When the credit activity happened */}
          {isBoost ? (
            <Row label="Boost applied">{formatAppliedDateTime(tx.createdAt)}</Row>
          ) : (
            <Row label={isDebit ? 'Ad posting used' : 'Credited on'}>
              {formatAppliedDateTime(tx.createdAt)}
            </Row>
          )}

          {/* 3. Validity duration */}
          {validityDisplay && (
            <Row label="Validity">{validityDisplay}</Row>
          )}

          {/* 4. Boost expires (for boosts/spotlights) */}
          {tx.spotlightExpiresAt && (
            <Row label="Boost expires">
              <span className={new Date(tx.spotlightExpiresAt).getTime() <= now ? 'text-destructive font-medium' : 'text-foreground'}>
                {formatDate(tx.spotlightExpiresAt)}
              </span>
            </Row>
          )}

          {/* 5. Ad expires (for all listings) */}
          {tx.adExpiresAt && (
            <Row label="Ad expires">
              <span className={new Date(tx.adExpiresAt).getTime() <= now ? 'text-destructive font-medium' : 'text-foreground'}>
                {formatDate(tx.adExpiresAt)}
              </span>
            </Row>
          )}

          {/* 6. Listing link */}
          {(() => {
            const adHref = getListingDetailHref(tx);
            if (!adHref) return null;
            return (
              <Row label="Listing">
                <Link
                  href={adHref}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  {tx.adTitle || 'View Listing'}
                  <ArrowRight className="w-3 h-3 shrink-0" />
                </Link>
              </Row>
            );
          })()}

          {/* 7. Amount */}
          <Row label="Amount">
            <span className={isDebit ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
              {isDebit ? `-${absAmount} ${creditWord} used` : `+${absAmount} ${creditWord} added`}
            </span>
          </Row>

          {/* 8. Status */}
          <Row label="Status">{renderTransactionStatus(tx)}</Row>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border/40 flex justify-end">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 px-5 rounded-lg text-caption font-semibold cursor-pointer"
            >
              OK
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};
