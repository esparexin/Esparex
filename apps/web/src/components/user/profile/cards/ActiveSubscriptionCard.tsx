import React from 'react';
import type { SubscriptionSummaryDTO } from '@esparex/contracts';

interface ActiveSubscriptionCardProps {
  subscription: SubscriptionSummaryDTO | null;
  onBrowsePlans?: () => void;
}

export const ActiveSubscriptionCard: React.FC<ActiveSubscriptionCardProps> = ({
  subscription,
  onBrowsePlans,
}) => {
  if (!subscription) {
    return (
      <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground mb-2">
              Free Tier
            </div>
            <h3 className="text-lg font-bold text-foreground">No Active Subscription</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade to a Pro or Business plan to unlock unlimited listings, top placements, and priority buyer inquiries.
            </p>
          </div>
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm whitespace-nowrap"
            >
              Browse Plans
            </button>
          )}
        </div>
      </div>
    );
  }

  const isExpired = subscription.status === 'EXPIRED';
  const daysRemaining = subscription.daysRemaining ?? 0;

  return (
    <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary uppercase tracking-wide">
              {subscription.category} TIER
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                isExpired
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {subscription.status}
            </span>
          </div>

          <h3 className="text-xl font-bold text-foreground tracking-tight">{subscription.planName}</h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
            <span>
              Started: <strong className="text-foreground">{new Date(subscription.startDate).toLocaleDateString()}</strong>
            </span>
            {subscription.endDate && (
              <span>
                Expires: <strong className="text-foreground">{new Date(subscription.endDate).toLocaleDateString()}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 border-border/40 pt-3 sm:pt-0">
          {!isExpired && daysRemaining > 0 && (
            <div className="text-sm font-semibold text-foreground">
              <span className="text-2xl font-black text-primary">{daysRemaining}</span> days remaining
            </div>
          )}
          {onBrowsePlans && (
            <button
              onClick={onBrowsePlans}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Change Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
