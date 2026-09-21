import React, { useState } from 'react';
import Link from 'next/link';
import type { CreditLedgerDTO } from '@esparex/contracts';
import { Pagination, ArrowUp, ArrowDown, Button } from '@esparex/ui';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';

const formatReason = (reason?: string) => {
  if (!reason) return 'Credit Activity';
  const clean = reason.replace(/[0-9a-fA-F]{24}/g, '').replace(/\s+to\s+ad\s*/i, ' ').trim();
  const lower = clean.toLowerCase();
  if (lower.includes('spotlight')) return 'Spotlight Boost Applied';
  if (lower.includes('top_ad') || lower.includes('top ad')) return 'Top Ad Boost Applied';
  if (lower.includes('smart_alert') || lower.includes('smart alert')) return 'Smart Alert Slot Consumed';
  if (lower.includes('alert')) return 'Smart Alert Activity';
  if (lower.includes('post') || lower.includes('ad_posting')) return 'Ad Posting Credit Used';
  if (lower.includes('pack') || lower.includes('purchase')) return 'Credit Pack Purchased';
  if (lower.includes('plan')) return 'Plan Entitlement Applied';
  if (lower.includes('credit transaction')) return 'Credit Adjustment';
  return clean || 'Credit Activity';
};

const formatActivityName = (tx: CreditLedgerDTO) => {
  const isDebit = tx.type === 'DEBIT';
  const absAmount = Math.abs(tx.amount);
  const creditWord = absAmount === 1 ? 'credit' : 'credits';
  const cleanReason = formatReason(tx.reason);

  if (isDebit) {
    if (cleanReason.toLowerCase().includes('spotlight')) return `Spotlight Credit Used — ${absAmount} ${creditWord}`;
    if (cleanReason.toLowerCase().includes('top ad')) return `Top Ad Credit Used — ${absAmount} ${creditWord}`;
    if (cleanReason.toLowerCase().includes('smart alert')) return `Smart Alert Slot Consumed — ${absAmount} ${creditWord}`;
    if (cleanReason.toLowerCase().includes('ad posting')) return `Ad Posting Credit Used — ${absAmount} ${creditWord}`;
    return `${cleanReason} — ${absAmount} ${creditWord}`;
  }
  return `${cleanReason} (+${absAmount} ${creditWord})`;
};

const formatAppliedDateTime = (isoDate: string) => {
  const d = new Date(isoDate);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const renderSpotlightStatus = (tx: CreditLedgerDTO) => {
  if (!tx.spotlightStatus && !tx.listingId) return <span className="text-muted-foreground">—</span>;
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

const renderAdStatus = (tx: CreditLedgerDTO) => {
  if (!tx.adStatus) return <span className="text-muted-foreground">—</span>;
  if (tx.adStatus === 'ACTIVE') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        Active
      </span>
    );
  }
  if (tx.adStatus === 'EXPIRED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold bg-destructive/10 text-destructive border border-destructive/20">
        Original Ad Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-tiny font-medium bg-muted text-muted-foreground border border-border/40">
      {tx.adStatus}
    </span>
  );
};

export const CreditLedgerHistoryCard: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useCreditLedgerHistory(page, limit);

  const items: CreditLedgerDTO[] = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-caption sm:text-body font-bold text-foreground uppercase tracking-wider">
            Credit Usage History
          </h4>
          <p className="text-tiny text-muted-foreground">Trace credit deductions, applied ads, and independent validities</p>
        </div>
        {pagination && (
          <span className="text-tiny text-muted-foreground font-medium">
            Total Activities: {pagination.total}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="p-3.5 bg-destructive/10 text-destructive rounded-xl text-tiny flex justify-between items-center border border-destructive/20">
          <span>Failed to load transaction history.</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => void refetch()}
            className="font-bold underline cursor-pointer hover:opacity-80 p-0 h-auto text-tiny text-destructive"
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-8 text-tiny text-muted-foreground">
          No credit transactions recorded yet.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* DESKTOP TABLE VIEW (md: and up) */}
          <div className="hidden md:block overflow-x-auto relative rounded-xl border border-border/40">
            <table className="w-full text-left text-caption">
              <thead className="bg-muted/40 border-b border-border/40">
                <tr className="text-muted-foreground font-semibold text-tiny">
                  <th scope="col" className="py-2.5 px-3.5 whitespace-nowrap">Applied Date</th>
                  <th scope="col" className="py-2.5 px-3">Plan / Credit Type</th>
                  <th scope="col" className="py-2.5 px-3">Applied to Ad</th>
                  <th scope="col" className="py-2.5 px-3">Applied Validity</th>
                  <th scope="col" className="py-2.5 px-3">Spotlight Status</th>
                  <th scope="col" className="py-2.5 px-3.5">Ad Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {items.map((tx) => {
                  const isDebit = tx.type === 'DEBIT';
                  const absAmount = Math.abs(tx.amount);
                  const adTarget = tx.adSlug || tx.listingId;

                  return (
                    <tr key={tx.transactionId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground text-tiny">
                        {formatAppliedDateTime(tx.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-foreground text-caption">
                          {formatActivityName(tx)}
                        </div>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 rounded text-tiny font-bold ${
                            isDebit ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isDebit ? `-${absAmount} USED` : `+${absAmount} ADDED`}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {adTarget ? (
                          <Link
                            href={`/ads/${adTarget}`}
                            className="font-medium text-primary hover:underline line-clamp-1 max-w-xs"
                          >
                            {tx.adTitle || 'View Ad'}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-tiny text-foreground-secondary whitespace-nowrap">
                        {tx.validityText || (isDebit ? '1 day' : '—')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderSpotlightStatus(tx)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {renderAdStatus(tx)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE TOUCH-FRIENDLY ACTIVITY CARDS (< md:) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {items.map((tx) => {
              const isDebit = tx.type === 'DEBIT';
              const absAmount = Math.abs(tx.amount);
              const adTarget = tx.adSlug || tx.listingId;

              return (
                <div
                  key={tx.transactionId}
                  className="p-3 rounded-xl border border-border/40 bg-card space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-tiny text-muted-foreground">
                      {formatAppliedDateTime(tx.createdAt)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold ${
                        isDebit ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isDebit ? <><ArrowDown className="w-3 h-3" /> -{absAmount} USED</> : <><ArrowUp className="w-3 h-3" /> +{absAmount} ADDED</>}
                    </span>
                  </div>

                  <div className="font-semibold text-foreground text-caption">
                    {formatActivityName(tx)}
                  </div>

                  {adTarget && (
                    <div className="text-caption pt-1 border-t border-border/20 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-tiny text-muted-foreground">
                        <span>Applied to Ad:</span>
                        <Link href={`/ads/${adTarget}`} className="font-semibold text-primary hover:underline truncate">
                          {tx.adTitle || 'View Ad'}
                        </Link>
                      </div>
                      <div className="text-tiny text-muted-foreground">
                        Applied Validity: <strong className="text-foreground-secondary">{tx.validityText || '1 day'}</strong>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-tiny text-muted-foreground">Spotlight:</span>
                        {renderSpotlightStatus(tx)}
                        <span className="text-tiny text-muted-foreground ml-1">Ad:</span>
                        {renderAdStatus(tx)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          onPageChange={setPage}
          itemLabel="activities"
          className="pt-2 border-t border-border/40"
        />
      )}
    </div>
  );
};
