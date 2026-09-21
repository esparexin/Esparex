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
import { formatActivityName, formatAppliedDateTime, renderTransactionStatus } from './CreditLedgerFormatters';
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
  if (!tx) return null;

  const isDebit = tx.type === 'DEBIT';
  const absAmount = Math.abs(tx.amount);
  const creditWord = absAmount === 1 ? 'credit' : 'credits';
  const adTarget = tx.adSlug || tx.listingId;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        variant="centered"
        className="max-w-sm sm:max-w-md p-0 overflow-hidden"
        aria-describedby="ledger-detail-desc"
      >
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="text-body font-bold text-foreground">Activity Details</DialogTitle>
          <p id="ledger-detail-desc" className="text-tiny text-muted-foreground mt-0.5">
            {formatActivityName(tx)}
          </p>
        </DialogHeader>

        <div className="px-5 py-3">
          {/* 1. When the listing was originally posted — distinct from when credit was applied */}
          {tx.adPostedAt && (
            <Row label="Listing posted">{formatDate(tx.adPostedAt)}</Row>
          )}

          {/* 2. When the credit activity happened (spotlight applied / ad posted / credit added) */}
          <Row label={isDebit ? (tx.spotlightExpiresAt ? 'Boost applied' : 'Ad posting used') : 'Credited on'}>
            {formatAppliedDateTime(tx.createdAt)}
          </Row>

          {/* 3. Validity period of the credit/entitlement */}
          {tx.validityText && (
            <Row label="Validity">{tx.validityText}</Row>
          )}

          {/* 4. Expiry — ad expiry or boost expiry, whichever is relevant */}
          {tx.spotlightExpiresAt && (
            <Row label="Boost expires">
              <span className={new Date(tx.spotlightExpiresAt).getTime() <= Date.now() ? 'text-destructive' : 'text-foreground'}>
                {formatDate(tx.spotlightExpiresAt)}
              </span>
            </Row>
          )}
          {tx.adExpiresAt && (
            <Row label="Ad expires">
              <span className={new Date(tx.adExpiresAt).getTime() <= Date.now() ? 'text-destructive' : 'text-foreground'}>
                {formatDate(tx.adExpiresAt)}
              </span>
            </Row>
          )}

          {/* 5. Listing link */}
          {adTarget && (
            <Row label="Listing">
              <Link
                href={`/ads/${adTarget}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                {tx.adTitle || 'View Listing'}
                <ArrowRight className="w-3 h-3 shrink-0" />
              </Link>
            </Row>
          )}

          {/* 6. Amount */}
          <Row label="Amount">
            <span className={isDebit ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
              {isDebit ? `-${absAmount} ${creditWord} used` : `+${absAmount} ${creditWord} added`}
            </span>
          </Row>

          {/* 7. Status */}
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
